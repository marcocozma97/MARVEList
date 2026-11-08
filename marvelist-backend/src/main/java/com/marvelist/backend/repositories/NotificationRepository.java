package com.marvelist.backend.repositories;

import com.marvelist.backend.entities.Comment;
import com.marvelist.backend.entities.Notification;
import com.marvelist.backend.entities.NotificationType;
import com.marvelist.backend.entities.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @EntityGraph(attributePaths = {"actor", "comment", "media"})
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);

    long countByRecipientAndReadFalse(User recipient);

    @Query("select n.media.id, n.type from Notification n where n.recipient = :recipient and n.media.id in :ids and n.type in :types")
    List<Object[]> findMediaKeys(@Param("recipient") User recipient, @Param("ids") Collection<Long> ids,
                                 @Param("types") Collection<NotificationType> types);

    @Modifying
    @Query("update Notification n set n.read = true where n.recipient = :recipient and n.read = false")
    int markAllRead(@Param("recipient") User recipient);

    @Modifying
    @Query("delete from Notification n where n.comment.id in :ids")
    void deleteByCommentIds(@Param("ids") Collection<Long> ids);

    @Modifying
    @Query("delete from Notification n where n.actor = :actor and n.type = :type and n.comment = :comment")
    void deleteByActorAndTypeAndComment(@Param("actor") User actor, @Param("type") NotificationType type, @Param("comment") Comment comment);

    @Modifying
    @Query("delete from Notification n where n.actor = :actor and n.recipient = :recipient and n.type = :type")
    void deleteByActorAndRecipientAndType(@Param("actor") User actor, @Param("recipient") User recipient, @Param("type") NotificationType type);
}
