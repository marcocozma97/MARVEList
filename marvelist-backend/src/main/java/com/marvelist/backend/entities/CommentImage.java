package com.marvelist.backend.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "comment_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private byte[] data;
}
