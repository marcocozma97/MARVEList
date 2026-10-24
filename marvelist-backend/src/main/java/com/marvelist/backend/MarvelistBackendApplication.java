package com.marvelist.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // controllo giornaliero delle date di uscita dei titoli in arrivo (PosterSyncService)
public class MarvelistBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(MarvelistBackendApplication.class, args);
	}

}
