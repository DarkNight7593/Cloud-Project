package com.example.demo.HistoriaClinica.domain;

import com.example.demo.Cita.domain.Cita;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.sql.Date;
import java.util.List;

@Getter
@Setter
@Entity
public class HistoriaClinica {
    @Id
    private String dniPaciente;

    private Date fechaCreacion;

    // Relación con Citas
    @JsonIgnore
    @OneToMany(mappedBy = "historiaClinica", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Cita> citas;

}
