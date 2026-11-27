package com.harsku.movietime.service;

import com.harsku.movietime.dto.MovieDtos.*;
import com.harsku.movietime.entity.Movie;
import com.harsku.movietime.entity.Review;
import com.harsku.movietime.entity.Show;
import com.harsku.movietime.entity.User;
import com.harsku.movietime.repository.MovieRepository;
import com.harsku.movietime.repository.ReviewRepository;
import com.harsku.movietime.repository.ShowRepository;
import com.harsku.movietime.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class MovieService {

    private final MovieRepository movieRepository;
    private final ShowRepository showRepository;
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final SlugService slugService;
    private final ShowBookingService showBookingService;

    public MovieService(
            MovieRepository movieRepository,
            ShowRepository showRepository,
            ReviewRepository reviewRepository,
            UserRepository userRepository,
            SlugService slugService,
            ShowBookingService showBookingService) {
        this.movieRepository = movieRepository;
        this.showRepository = showRepository;
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.slugService = slugService;
        this.showBookingService = showBookingService;
    }

    @Transactional(readOnly = true)
    public List<MovieDto> getAllMovies() {
        return movieRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toMovieDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public MovieDetailDto getMovieBySlug(String slug) {
        Movie movie = movieRepository.findBySlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        List<ShowDto> shows = showRepository.findByMovieIdOrderByShowTimeAsc(movie.getId())
                .stream()
                .map(showBookingService::toShowDto)
                .toList();

        List<ReviewDto> reviews = reviewRepository.findByMovieIdOrderByCreatedAtDesc(movie.getId())
                .stream()
                .map(this::toReviewDto)
                .toList();

        return new MovieDetailDto(toMovieDto(movie), shows, reviews);
    }

    @Transactional
    public MovieDto createMovie(CreateMovieRequest req) {
        Movie movie = new Movie();
        movie.setName(req.name().trim());
        movie.setSlug(slugService.generateUniqueSlug(req.name().trim(), null));
        movie.setDescription(req.description());
        movie.setImageUrl(req.imageUrl());
        movie.setAdultRating(req.adultRating() != null && !req.adultRating().isBlank() ? req.adultRating() : "PG-13");
        movie.setGenres(req.genres() != null ? req.genres() : List.of());
        movie.setDurationMinutes(req.durationMinutes() != null ? req.durationMinutes() : 120);
        movie.setReleaseDate(req.releaseDate());
        movie = movieRepository.save(movie);
        return toMovieDto(movie);
    }

    @Transactional
    public MovieDto updateMovie(UUID id, CreateMovieRequest req) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));

        movie.setName(req.name().trim());
        movie.setSlug(slugService.generateUniqueSlug(req.name().trim(), id));
        movie.setDescription(req.description());
        movie.setImageUrl(req.imageUrl());
        if (req.adultRating() != null && !req.adultRating().isBlank()) {
            movie.setAdultRating(req.adultRating());
        }
        if (req.genres() != null) {
            movie.setGenres(req.genres());
        }
        if (req.durationMinutes() != null) {
            movie.setDurationMinutes(req.durationMinutes());
        }
        movie.setReleaseDate(req.releaseDate());

        movie = movieRepository.save(movie);
        return toMovieDto(movie);
    }

    @Transactional
    public void deleteMovie(UUID id) {
        if (!movieRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found");
        }
        movieRepository.deleteById(id);
    }

    @Transactional
    public ReviewDto addReview(UUID movieId, UUID userId, CreateReviewRequest req) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Movie not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Review review = new Review();
        review.setMovie(movie);
        review.setUser(user);
        review.setReview(req.review().trim());
        review.setRating(req.rating());
        review = reviewRepository.save(review);

        return toReviewDto(review);
    }

    public MovieDto toMovieDto(Movie movie) {
        List<Review> reviews = reviewRepository.findByMovieIdOrderByCreatedAtDesc(movie.getId());
        double avg = reviews.isEmpty()
                ? 0.0
                : Math.round(reviews.stream().mapToInt(Review::getRating).average().orElse(0.0) * 10.0) / 10.0;

        return new MovieDto(
                movie.getId(),
                movie.getName(),
                movie.getSlug(),
                movie.getDescription(),
                movie.getImageUrl(),
                movie.getAdultRating(),
                movie.getGenres(),
                movie.getDurationMinutes(),
                movie.getReleaseDate(),
                avg,
                reviews.size(),
                movie.getCreatedAt()
        );
    }

    public ReviewDto toReviewDto(Review r) {
        String userName = r.getUser().getFirstName() + " " + r.getUser().getLastName();
        return new ReviewDto(
                r.getId(),
                r.getUser().getId(),
                userName.trim(),
                r.getMovie().getId(),
                r.getReview(),
                r.getRating(),
                r.getCreatedAt()
        );
    }
}
