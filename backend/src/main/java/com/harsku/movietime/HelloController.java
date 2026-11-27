
package com.harsku.movietime;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/")
    public String home() {
        return "Welcome to MovieTime!";
    }

    @GetMapping("/hello")
    public String hello() {
        return "Spring Boot is working!";
    }
}
