package com.harsku.movietime.repository;

import com.harsku.movietime.entity.Movie;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MovieRepository extends JpaRepository<Movie, UUID> {
    Optional<Movie> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<Movie> findAllByOrderByCreatedAtDesc();
}
