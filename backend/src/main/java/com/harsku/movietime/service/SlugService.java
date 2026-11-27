package com.harsku.movietime.service;

import com.harsku.movietime.repository.MovieRepository;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;

@Service
public class SlugService {

    private final MovieRepository movieRepository;

    public SlugService(MovieRepository movieRepository) {
        this.movieRepository = movieRepository;
    }

    public String generateUniqueSlug(String title, UUID excludeMovieId) {
        String base = toSlug(title);
        if (base.isBlank()) {
            base = "movie";
        }

        String candidate = base;
        int counter = 2;
        while (isSlugTaken(candidate, excludeMovieId)) {
            candidate = base + "-" + counter;
            counter++;
        }
        return candidate;
    }

    private boolean isSlugTaken(String slug, UUID excludeMovieId) {
        return movieRepository.findBySlug(slug)
                .map(existing -> excludeMovieId == null || !existing.getId().equals(excludeMovieId))
                .orElse(false);
    }

    private String toSlug(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String ascii = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return ascii.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("[\\s-]+", "-")
                .replaceAll("^-|-$", "");
    }
}
