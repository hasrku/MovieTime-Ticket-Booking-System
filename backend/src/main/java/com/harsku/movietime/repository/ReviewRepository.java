package com.harsku.movietime.repository;

import com.harsku.movietime.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByMovieIdOrderByCreatedAtDesc(UUID movieId);
}
