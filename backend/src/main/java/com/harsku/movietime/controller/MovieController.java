package com.harsku.movietime.controller;

import com.harsku.movietime.dto.MovieDtos.*;
import com.harsku.movietime.service.MovieService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/movies")
public class MovieController {

    private final MovieService movieService;

    public MovieController(MovieService movieService) {
        this.movieService = movieService;
    }

    @GetMapping
    public ResponseEntity<List<MovieDto>> getAllMovies() {
        return ResponseEntity.ok(movieService.getAllMovies());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<MovieDetailDto> getMovieBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(movieService.getMovieBySlug(slug));
    }

    @PostMapping("/{movieId}/reviews")
    public ResponseEntity<ReviewDto> addReview(
            @PathVariable UUID movieId,
            Authentication authentication,
            @Valid @RequestBody CreateReviewRequest req) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok(movieService.addReview(movieId, userId, req));
    }
}
