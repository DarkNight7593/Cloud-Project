package com.example.demo.HistoriaClinica.domain;

import com.example.demo.Cita.domain.Cita;
import com.example.demo.Cita.repository.CitaRepository;
import com.example.demo.HistoriaClinica.repository.HistoriaClinicaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

@Service
public class HistoriaClinicaService {
    @Autowired
    CitaRepository citaRepository;
    @Autowired
    private HistoriaClinicaRepository historiaClinicaRepository;
    @Autowired
    RestTemplate restTemplate;

    // URL de la otra API
    private static final String DOCTOR_API_URL = "http://doctores:3000/doctors";

    // Obtener todas las historias clínicas
    public List<HistoriaClinica> getAllHistoriasClinicas() {
        return historiaClinicaRepository.findAll();
    }

    // Obtener una historia clínica por DNI de paciente
    public Optional<HistoriaClinica> getHistoriaClinicaByDniPaciente(String dniPaciente) {
        return historiaClinicaRepository.findById(dniPaciente);
    }

    // Guardar una nueva historia clínica
    public HistoriaClinica saveHistoriaClinica(HistoriaClinica historiaClinica) {
        return historiaClinicaRepository.save(historiaClinica);
    }

    // Eliminar una historia clínica
    public void deleteHistoriaClinica(String dniPaciente) {
        // Obtener todas las citas del paciente
        List<Cita> citasDelPaciente = citaRepository.findByHistoriaClinica_DniPaciente(dniPaciente);

        // Por cada cita, actualizar el total de citas del doctor
        for (Cita cita : citasDelPaciente) {
            String updateUrl = DOCTOR_API_URL + "/" + cita.getDniDoctor() + "/citas/-1";
            try {
                restTemplate.put(updateUrl, null);
                System.out.println("Total de citas actualizado para el doctor con DNI: " + cita.getDniDoctor());
            } catch (Exception e) {
                System.out.println("Error al actualizar el total de citas del doctor: " + e.getMessage());
            }
        }

        // Eliminar las citas del paciente
        citaRepository.deleteAll(citasDelPaciente);

        // Finalmente, eliminar la historia clínica
        historiaClinicaRepository.deleteById(dniPaciente);
        System.out.println("Historia clínica eliminada con éxito");
    }
}

