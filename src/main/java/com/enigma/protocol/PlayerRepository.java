package com.enigma.protocol;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, String> {
    List<Player> findAllByOrderByStartTimeDesc();
    List<Player> findByCompletedTrueOrderByTotalTimeMsAsc();
}
