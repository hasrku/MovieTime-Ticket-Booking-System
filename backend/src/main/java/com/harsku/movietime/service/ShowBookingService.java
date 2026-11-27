package com.harsku.movietime.service;

import com.harsku.movietime.dto.MovieDtos.*;
import com.harsku.movietime.entity.Booking;
import com.harsku.movietime.entity.Movie;
import com.harsku.movietime.entity.SeatTicket;
import com.harsku.movietime.entity.Show;
import com.harsku.movietime.entity.User;
import com.harsku.movietime.repository.BookingRepository;
import com.harsku.movietime.repository.MovieRepository;
import com.harsku.movietime.repository.ShowRepository;
import com.harsku.movietime.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ShowBookingService {

    private final ShowRepository showRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConcurrentHashMap<UUID, Object> showLocks = new ConcurrentHashMap<>();

    public ShowBookingService(
            ShowRepository showRepository,
            MovieRepository movieRepository,
            UserRepository userRepository,
            BookingRepository bookingRepository,
            SimpMessagingTemplate messagingTemplate) {
        this.showRepository = showRepository;
        this.movieRepository = movieRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<ShowDto> getAllShows() {
        return showRepository.findAllByOrderByShowTimeAsc()
                .stream()
                .map(this::toShowDto)
                .toList();
    }

    @Transactional
    public ShowDto getShow(UUID showId) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Show not found"));
        if (releaseExpiredLocks(show)) {
            show = showRepository.save(show);
            broadcastSeats(show);
        }
        return toShowDto(show);
    }

    @Transactional
    public ShowDto createShow(CreateShowRequest req) {
        Movie movie = movieRepository.findById(req.movieId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        int rows = req.rows() != null && req.rows() > 0 ? Math.min(req.rows(), 12) : 6;
        int cols = req.seatsPerRow() != null && req.seatsPerRow() > 0 ? Math.min(req.seatsPerRow(), 14) : 8;

        Show show = new Show();
        show.setMovie(movie);
        show.setScreenName(req.screenName().trim());
        show.setShowTime(req.showTime());
        show.setTicketPrice(req.ticketPrice());
        show.setTickets(generateSeatGrid(rows, cols, req.ticketPrice()));

        show = showRepository.save(show);
        return toShowDto(show);
    }

    @Transactional
    public ShowDto updateShowTickets(UUID showId, UpdateTicketsRequest req) {
        Show show = showRepository.findById(showId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Show not found"));
        show.setTickets(req.tickets());
        show = showRepository.save(show);
        broadcastSeats(show);
        return toShowDto(show);
    }

    @Transactional
    public void deleteShow(UUID showId) {
        if (!showRepository.existsById(showId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Show not found");
        }
        showRepository.deleteById(showId);
    }

    @Transactional
    public ShowDto lockSeats(UUID showId, UUID userId, List<String> seatNumbers) {
        Object lock = showLocks.computeIfAbsent(showId, k -> new Object());
        synchronized (lock) {
            Show show = showRepository.findById(showId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Show not found"));

            releaseExpiredLocks(show);

            Set<String> requested = new HashSet<>(seatNumbers);
            String lockUntil = OffsetDateTime.now().plusMinutes(5).toString();

            for (SeatTicket seat : show.getTickets()) {
                if (requested.contains(seat.getSeatNumber())) {
                    if ("BOOKED".equals(seat.getStatus())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Seat " + seat.getSeatNumber() + " is already booked");
                    }
                    if ("LOCKED".equals(seat.getStatus())
                            && seat.getLockedBy() != null
                            && !seat.getLockedBy().equals(userId)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Seat " + seat.getSeatNumber() + " is currently held by another user");
                    }
                    seat.setStatus("LOCKED");
                    seat.setLockedBy(userId);
                    seat.setLockedUntil(lockUntil);
                }
            }

            show = showRepository.save(show);
            broadcastSeats(show);
            return toShowDto(show);
        }
    }

    @Transactional
    public ShowDto unlockSeats(UUID showId, UUID userId, List<String> seatNumbers) {
        Object lock = showLocks.computeIfAbsent(showId, k -> new Object());
        synchronized (lock) {
            Show show = showRepository.findById(showId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Show not found"));

            Set<String> requested = new HashSet<>(seatNumbers);
            for (SeatTicket seat : show.getTickets()) {
                if (requested.contains(seat.getSeatNumber())
                        && "LOCKED".equals(seat.getStatus())
                        && userId.equals(seat.getLockedBy())) {
                    seat.setStatus("AVAILABLE");
                    seat.setLockedBy(null);
                    seat.setLockedUntil(null);
                }
            }

            show = showRepository.save(show);
            broadcastSeats(show);
            return toShowDto(show);
        }
    }

    @Transactional
    public BookingDto confirmBooking(UUID showId, UUID userId, List<String> seatNumbers) {
        Object lock = showLocks.computeIfAbsent(showId, k -> new Object());
        synchronized (lock) {
            Show show = showRepository.findById(showId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Show not found"));
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

            releaseExpiredLocks(show);

            Set<String> requested = new HashSet<>(seatNumbers);
            if (requested.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No seats selected");
            }

            BigDecimal total = BigDecimal.ZERO;
            List<String> confirmedSeats = new ArrayList<>();

            for (SeatTicket seat : show.getTickets()) {
                if (requested.contains(seat.getSeatNumber())) {
                    if ("BOOKED".equals(seat.getStatus())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Seat " + seat.getSeatNumber() + " is already booked");
                    }
                    if ("LOCKED".equals(seat.getStatus())
                            && seat.getLockedBy() != null
                            && !seat.getLockedBy().equals(userId)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Seat " + seat.getSeatNumber() + " is held by another user");
                    }
                    seat.setStatus("BOOKED");
                    seat.setBookedBy(userId);
                    seat.setLockedBy(null);
                    seat.setLockedUntil(null);
                    total = total.add(seat.getPrice() != null ? seat.getPrice() : show.getTicketPrice());
                    confirmedSeats.add(seat.getSeatNumber());
                }
            }

            if (confirmedSeats.size() != requested.size()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "One or more seats do not exist");
            }

            show = showRepository.save(show);

            Booking booking = new Booking();
            booking.setUser(user);
            booking.setShow(show);
            booking.setSeats(confirmedSeats);
            booking.setTotalAmount(total);
            booking.setStatus("CONFIRMED");
            booking = bookingRepository.save(booking);

            broadcastSeats(show);
            return toBookingDto(booking);
        }
    }

    @Transactional(readOnly = true)
    public List<BookingDto> getUserBookings(UUID userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toBookingDto)
                .toList();
    }

    public List<SeatTicket> generateSeatGrid(int rows, int cols, BigDecimal basePrice) {
        List<SeatTicket> list = new ArrayList<>();
        BigDecimal vipPrice = basePrice.multiply(new BigDecimal("1.40")).setScale(2, RoundingMode.HALF_UP);

        for (int r = 0; r < rows; r++) {
            String rowLabel = String.valueOf((char) ('A' + r));
            boolean isVip = r < 2;
            for (int c = 1; c <= cols; c++) {
                String seatNum = rowLabel + c;
                list.add(new SeatTicket(
                        seatNum,
                        rowLabel,
                        c,
                        isVip ? "VIP" : "STANDARD",
                        isVip ? vipPrice : basePrice,
                        "AVAILABLE"
                ));
            }
        }
        return list;
    }

    private boolean releaseExpiredLocks(Show show) {
        boolean changed = false;
        OffsetDateTime now = OffsetDateTime.now();
        for (SeatTicket seat : show.getTickets()) {
            if ("LOCKED".equals(seat.getStatus())
                    && seat.getLockedUntil() != null
                    && OffsetDateTime.parse(seat.getLockedUntil()).isBefore(now)) {
                seat.setStatus("AVAILABLE");
                seat.setLockedBy(null);
                seat.setLockedUntil(null);
                changed = true;
            }
        }
        return changed;
    }

    private void broadcastSeats(Show show) {
        messagingTemplate.convertAndSend("/topic/shows/" + show.getId() + "/seats", toShowDto(show));
    }

    public ShowDto toShowDto(Show show) {
        long available = show.getTickets().stream()
                .filter(t -> "AVAILABLE".equals(t.getStatus()))
                .count();

        return new ShowDto(
                show.getId(),
                show.getMovie().getId(),
                show.getMovie().getName(),
                show.getMovie().getSlug(),
                show.getScreenName(),
                show.getShowTime(),
                show.getTicketPrice(),
                show.getTickets(),
                available
        );
    }

    public BookingDto toBookingDto(Booking booking) {
        Show show = booking.getShow();
        Movie movie = show.getMovie();
        return new BookingDto(
                booking.getId(),
                show.getId(),
                movie.getName(),
                movie.getSlug(),
                movie.getImageUrl(),
                show.getScreenName(),
                show.getShowTime(),
                booking.getSeats(),
                booking.getTotalAmount(),
                booking.getStatus(),
                booking.getCreatedAt()
        );
    }
}
