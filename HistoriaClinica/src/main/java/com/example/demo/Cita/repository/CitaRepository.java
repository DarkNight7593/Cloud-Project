package com.example.demo.Cita.repository;

import com.example.demo.Cita.domain.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {
    List<Cita> findByHistoriaClinica_DniPaciente(String dniPaciente);
}

