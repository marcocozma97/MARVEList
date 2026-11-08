package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.Comment;
import com.marvelist.backend.entities.CommentLike;
import com.marvelist.backend.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    Optional<CommentLike> findByUserAndComment(User user, Comment comment);

    long countByComment(Comment comment);

    @Query("select l.comment.id, count(l) from CommentLike l where l.comment.id in :ids group by l.comment.id")
    List<Object[]> countByCommentIds(@Param("ids") Collection<Long> ids);

    @Query("select l.comment.id from CommentLike l where l.user = :user and l.comment.id in :ids")
    List<Long> likedAmong(@Param("user") User user, @Param("ids") Collection<Long> ids);

    @Modifying
    @Query("delete from CommentLike l where l.comment.id in :ids")
    void deleteByCommentIds(@Param("ids") Collection<Long> ids);
}
