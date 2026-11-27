package com.harsku.movietime.repository;

import com.harsku.movietime.entity.Show;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ShowRepository extends JpaRepository<Show, UUID> {
    List<Show> findByMovieIdOrderByShowTimeAsc(UUID movieId);
    List<Show> findAllByOrderByShowTimeAsc();
}
