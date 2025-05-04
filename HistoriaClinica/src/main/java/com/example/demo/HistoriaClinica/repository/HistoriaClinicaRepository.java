package com.example.demo.HistoriaClinica.repository;

import com.example.demo.HistoriaClinica.domain.HistoriaClinica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoriaClinicaRepository extends JpaRepository<HistoriaClinica, String> {

}

