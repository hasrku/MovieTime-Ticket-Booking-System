package com.harsku.movietime.config;

import com.harsku.movietime.entity.*;
import com.harsku.movietime.repository.*;
import com.harsku.movietime.service.ShowBookingService;
import com.harsku.movietime.service.SlugService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final MovieRepository movieRepository;
    private final ShowRepository showRepository;
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;
    private final SlugService slugService;
    private final ShowBookingService showBookingService;

    public DataSeeder(
            JdbcTemplate jdbcTemplate,
            UserRepository userRepository,
            MovieRepository movieRepository,
            ShowRepository showRepository,
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            PasswordEncoder passwordEncoder,
            SlugService slugService,
            ShowBookingService showBookingService) {
        this.jdbcTemplate = jdbcTemplate;
        this.userRepository = userRepository;
        this.movieRepository = movieRepository;
        this.showRepository = showRepository;
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
        this.slugService = slugService;
        this.showBookingService = showBookingService;
    }

    @Override
public void run(String... args) {
    try {
        ensureSchema();
        seedUsers();
        seedMoviesShowsAndReviews();

        log.info("MovieTime database schema and synthetic seed data verified.");
    } catch (Exception e) {
        log.error("Database seeding failed. Full exception:", e);
    }
}

    private void ensureSchema() {
    ClassPathResource resource = new ClassPathResource("schema.sql");

    ResourceDatabasePopulator populator = new ResourceDatabasePopulator(resource);
    populator.setContinueOnError(false);
    populator.execute(jdbcTemplate.getDataSource());
}

    private void seedUsers() {
        createUserIfMissing("Aarav", "Sharma", "admin1@movietime.com", "+15550000001", "Admin@123", "admin");
        createUserIfMissing("Maya", "Lin", "admin2@movietime.com", "+15550000002", "Admin@123", "admin");
        createUserIfMissing("Rohan", "Verma", "user1@movietime.com", "+15551110001", "User@123", "user");
        createUserIfMissing("Elena", "Vance", "user2@movietime.com", "+15551110002", "User@123", "user");
        createUserIfMissing("Marcus", "Cole", "user3@movietime.com", "+15551110003", "User@123", "user");
    }

    private User createUserIfMissing(String firstName, String lastName, String email, String phone, String rawPassword, String role) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User u = new User();
            u.setFirstName(firstName);
            u.setLastName(lastName);
            u.setEmail(email);
            u.setPhone(phone);
            u.setPassword(passwordEncoder.encode(rawPassword));
            u.setRole(role);
            return userRepository.save(u);
        });
    }

    private void seedMoviesShowsAndReviews() {
        User user1 = userRepository.findByEmailIgnoreCase("user1@movietime.com").orElseThrow();
        User user2 = userRepository.findByEmailIgnoreCase("user2@movietime.com").orElseThrow();
        User user3 = userRepository.findByEmailIgnoreCase("user3@movietime.com").orElseThrow();

        if (movieRepository.count() > 0) {
            List<Show> existingShows = showRepository.findAll();
            boolean hasUniformShows = !existingShows.isEmpty() && existingShows.stream()
                    .allMatch(s -> "IMAX Laser - Hall 1".equals(s.getScreenName()) || "Dolby Atmos - Hall 2".equals(s.getScreenName()));
            if (hasUniformShows) {
                bookingRepository.deleteAll();
                showRepository.deleteAll();
                seedVariedShowsForMovies(movieRepository.findAll(), user1, user2, user3);
            }
            return;
        }

        List<Movie> movies = List.of(
                buildMovie(
                        "Interstellar",
                        "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.",
                        "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80",
                        "PG-13",
                        List.of("Sci-Fi", "Adventure", "Drama"),
                        169,
                        LocalDate.of(2014, 11, 7)
                ),
                buildMovie(
                        "Dune: Part Two",
                        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family, facing a choice between the love of his life and the fate of the universe.",
                        "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=900&q=80",
                        "PG-13",
                        List.of("Sci-Fi", "Action", "Adventure"),
                        166,
                        LocalDate.of(2024, 3, 1)
                ),
                buildMovie(
                        "The Dark Knight",
                        "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
                        "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=900&q=80",
                        "PG-13",
                        List.of("Action", "Crime", "Thriller"),
                        152,
                        LocalDate.of(2008, 7, 18)
                ),
                buildMovie(
                        "Oppenheimer",
                        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
                        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80",
                        "R",
                        List.of("Biography", "Drama", "History"),
                        180,
                        LocalDate.of(2023, 7, 21)
                ),
                buildMovie(
                        "Spider-Man: Across the Spider-Verse",
                        "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People charged with protecting its very existence.",
                        "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=900&q=80",
                        "PG",
                        List.of("Animation", "Action", "Adventure"),
                        140,
                        LocalDate.of(2023, 6, 2)
                ),
                buildMovie(
                        "Inception",
                        "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
                        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=900&q=80",
                        "PG-13",
                        List.of("Sci-Fi", "Action", "Thriller"),
                        148,
                        LocalDate.of(2010, 7, 16)
                )
        );

        movieRepository.saveAll(movies);
        seedVariedShowsForMovies(movies, user1, user2, user3);

        for (int i = 0; i < movies.size(); i++) {
            Movie m = movies.get(i);
            addReview(m, user1, "Absolutely breathtaking cinematography and sound design on the big screen!", 9);
            addReview(m, user2, "Worth every minute. The pacing and performances kept me hooked.", 8);
            if (i % 2 == 0) {
                addReview(m, user3, "A timeless theatrical experience. Highly recommend IMAX.", 10);
            }
        }
    }

    private record ShowTemplate(String screenName, int rows, int cols, String price, int hoursOffset, int[] bookedIndices) {}

    private void seedVariedShowsForMovies(List<Movie> movies, User user1, User user2, User user3) {
        OffsetDateTime baseTime = OffsetDateTime.now().plusHours(2).withMinute(0).withSecond(0).withNano(0);
        User[] buyers = {user1, user2, user3};

        List<List<ShowTemplate>> catalog = List.of(
                List.of(
                        new ShowTemplate("PVR IMAX - Screen 1", 7, 10, "16.50", 1, new int[]{12, 13, 24, 25, 34}),
                        new ShowTemplate("Cinepolis VIP Lounge - Hall 4", 5, 6, "22.00", 5, new int[]{7, 8, 15}),
                        new ShowTemplate("INOX Laserplex - Audi 2", 6, 8, "13.00", 26, new int[]{18, 19, 27, 28})
                ),
                List.of(
                        new ShowTemplate("Dolby Cinema - Grand Hall", 8, 10, "18.00", 2, new int[]{14, 15, 16, 33, 34, 44, 45}),
                        new ShowTemplate("Miraj Cinemas - Screen 3", 6, 8, "11.50", 28, new int[]{9, 10})
                ),
                List.of(
                        new ShowTemplate("Alamo Drafthouse - Theater A", 5, 8, "15.00", 3, new int[]{11, 12, 20, 21}),
                        new ShowTemplate("AMC Prime - Hall 5", 7, 9, "14.00", 25, new int[]{5, 6, 22, 23, 31, 32})
                ),
                List.of(
                        new ShowTemplate("IMAX 70mm - Flagship", 8, 12, "19.50", 4, new int[]{17, 18, 19, 29, 30, 41, 42, 52, 53}),
                        new ShowTemplate("Artisan Indie - Studio 2", 4, 6, "12.50", 27, new int[]{8, 9})
                ),
                List.of(
                        new ShowTemplate("4DX Motion - Hall 3", 6, 8, "17.00", 6, new int[]{10, 11, 19, 20, 29}),
                        new ShowTemplate("Regal RPX - Screen 6", 7, 8, "13.50", 30, new int[]{13, 14, 21})
                ),
                List.of(
                        new ShowTemplate("Dolby Atmos - Vault 1", 6, 10, "15.50", 7, new int[]{14, 15, 24, 25, 35, 36}),
                        new ShowTemplate("Classic Screen - Hall 2", 5, 7, "10.50", 29, new int[]{10, 11})
                )
        );

        for (int i = 0; i < movies.size(); i++) {
            Movie m = movies.get(i);
            List<ShowTemplate> templates = catalog.get(i % catalog.size());

            for (int j = 0; j < templates.size(); j++) {
                ShowTemplate tpl = templates.get(j);
                Show show = new Show();
                show.setMovie(m);
                show.setScreenName(tpl.screenName());
                show.setShowTime(baseTime.plusHours(tpl.hoursOffset()));
                show.setTicketPrice(new BigDecimal(tpl.price()));

                List<SeatTicket> tickets = showBookingService.generateSeatGrid(tpl.rows(), tpl.cols(), show.getTicketPrice());
                for (int k = 0; k < tpl.bookedIndices().length; k++) {
                    int idx = tpl.bookedIndices()[k];
                    if (idx < tickets.size()) {
                        tickets.get(idx).setStatus("BOOKED");
                        tickets.get(idx).setBookedBy(buyers[(i + k) % buyers.length].getId());
                    }
                }
                show.setTickets(tickets);
                show = showRepository.save(show);

                if (i == 0 && j == 0) {
                    Booking sampleBooking = new Booking();
                    sampleBooking.setUser(user1);
                    sampleBooking.setShow(show);
                    sampleBooking.setSeats(List.of(tickets.get(12).getSeatNumber(), tickets.get(13).getSeatNumber()));
                    sampleBooking.setTotalAmount(tickets.get(12).getPrice().add(tickets.get(13).getPrice()));
                    sampleBooking.setStatus("CONFIRMED");
                    bookingRepository.save(sampleBooking);
                }
            }
        }
    }

    private Movie buildMovie(String name, String description, String imageUrl, String adultRating,
                             List<String> genres, int durationMinutes, LocalDate releaseDate) {
        Movie m = new Movie();
        m.setName(name);
        m.setSlug(slugService.generateUniqueSlug(name, null));
        m.setDescription(description);
        m.setImageUrl(imageUrl);
        m.setAdultRating(adultRating);
        m.setGenres(genres);
        m.setDurationMinutes(durationMinutes);
        m.setReleaseDate(releaseDate);
        return m;
    }

    private void addReview(Movie movie, User user, String text, int rating) {
        Review r = new Review();
        r.setMovie(movie);
        r.setUser(user);
        r.setReview(text);
        r.setRating(rating);
        reviewRepository.save(r);
    }
}
