package com.example.demo.Cita.domain;

import com.example.demo.Cita.repository.CitaRepository;
import java.util.Map;

import com.example.demo.HistoriaClinica.domain.HistoriaClinica;
import com.example.demo.HistoriaClinica.repository.HistoriaClinicaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Optional;

@Service
public class CitaService {

    @Autowired
    CitaRepository citaRepository;
    @Autowired
    HistoriaClinicaRepository historiaClinicaRepository;

    @Autowired
    RestTemplate restTemplate;

    // Obtener todas las citas
    public List<Cita> getAllCitas() {
        return citaRepository.findAll();
    }

    // Obtener una cita por ID
    public Optional<Cita> getCitaById(Long id) {
        return citaRepository.findById(id);
    }

    // URL de la otra API
    private static final String DOCTOR_API_URL = "http://" + System.getenv("SERVICE_HOST") + ":8081/doctors";

    // Guardar una nueva cita y actualizar el total de citas del doctor
    public Cita saveCita(Cita cita,String dniPaciente) {
        String doctorUrl = DOCTOR_API_URL + "/" + cita.getDniDoctor();
        try {
            // Realizar una solicitud GET para obtener la información del doctor
            ResponseEntity<Map<String, Object>> response = restTemplate.getForEntity(doctorUrl, (Class<Map<String, Object>>)(Class<?>)Map.class);
            Map<String, Object> doctorInfo = response.getBody();

            // Extraer la especialidad del JSON
            if (doctorInfo != null && doctorInfo.containsKey("especialidad")) {
                cita.setEspecialidad((String) doctorInfo.get("especialidad"));
            } else {
                throw new Exception("Especialidad del doctor no encontrada");
            }
        } catch (Exception e) {
            System.out.println("Error al obtener la especialidad del doctor: " + e.getMessage());
            throw new RuntimeException("Error al obtener la especialidad del doctor");
        }

        // Obtener la historia clínica directamente de la base de datos
        Optional<HistoriaClinica> historiaClinica = historiaClinicaRepository.findById(dniPaciente);

        if (historiaClinica.isPresent()) {
            cita.setHistoriaClinica(historiaClinica.get());  // Asociar la historia clínica con la cita
        } else {
            throw new RuntimeException("Historia clínica no encontrada para el paciente con DNI: " + dniPaciente);
        }

        // Guardar la cita en la base de datos
        Cita savedCita = citaRepository.save(cita);

        // Actualizar el total de citas del doctor
        String updateUrl = DOCTOR_API_URL + "/" + cita.getDniDoctor() + "/citas/1";
        try {
            restTemplate.put(updateUrl, null);
            System.out.println("Total de citas actualizado con éxito");
        } catch (Exception e) {
            System.out.println("Error al actualizar el total de citas: " + e.getMessage());
        }

        return savedCita;
    }

    // Eliminar una cita y reducir el total de citas del doctor
    public void deleteCita(Long id) {
        Optional<Cita> cita = citaRepository.findById(id);

        if (cita.isPresent()) {
            String updateUrl = DOCTOR_API_URL + "/" + cita.get().getDniDoctor() + "/citas/-1"; // Restar 1 al total de citas

            try {
                // Hacer la solicitud para reducir el total de citas
                restTemplate.put(updateUrl, null);
                System.out.println("Total de citas actualizado con éxito");
            } catch (Exception e) {
                System.out.println("Error al actualizar el total de citas: " + e.getMessage());
            }

            // Finalmente, eliminar la cita
            citaRepository.deleteById(id);
            System.out.println("Cita eliminada con éxito");
        } else {
            System.out.println("Cita no encontrada");
        }
    }

    public List<Cita> getCitasByDniPaciente(String dniPaciente) {
        return citaRepository.findByHistoriaClinica_DniPaciente(dniPaciente);
    }
}
