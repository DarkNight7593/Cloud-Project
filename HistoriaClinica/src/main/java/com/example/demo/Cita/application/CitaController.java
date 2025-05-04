package com.example.demo.Cita.application;

import com.example.demo.Cita.domain.Cita;
import com.example.demo.Cita.domain.CitaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/citas")
public class CitaController {

    @Autowired
    private CitaService citaService;

    // Obtener todas las citas
    @Operation(summary = "Obtener todas las citas", description = "Devuelve una lista con todas las citas registradas.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de citas obtenida exitosamente"),
            @ApiResponse(responseCode = "404", description = "No se encontraron citas")
    })
    @GetMapping
    public List<Cita> getAllCitas() {
        return citaService.getAllCitas();
    }

    // Obtener una cita por ID
    @Operation(summary = "Obtener una cita por ID", description = "Devuelve una cita específica basada en su ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cita obtenida exitosamente"),
            @ApiResponse(responseCode = "404", description = "Cita no encontrada")
    })
    @GetMapping("/{id}")
    public Optional<Cita> getCitaById(@PathVariable Long id) {
        return citaService.getCitaById(id);
    }

    // Crear una nueva cita
    @Operation(summary = "Crear una nueva cita", description = "Crea una nueva cita para un paciente con el DNI proporcionado.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Cita creada exitosamente"),
            @ApiResponse(responseCode = "400", description = "Solicitud incorrecta")
    })
    @PostMapping("/{dniPaciente}")
    public Cita createCita(@RequestBody Cita cita, @PathVariable String dniPaciente) {
        return citaService.saveCita(cita, dniPaciente);
    }

    // Eliminar una cita
    @Operation(summary = "Eliminar una cita", description = "Elimina una cita específica basada en su ID.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cita eliminada exitosamente"),
            @ApiResponse(responseCode = "404", description = "Cita no encontrada")
    })
    @DeleteMapping("/{id}")
    public void deleteCita(@PathVariable Long id) {
        citaService.deleteCita(id);
    }

    // Obtener citas por DNI del paciente
    @Operation(summary = "Obtener citas por DNI de paciente", description = "Devuelve una lista de citas asociadas a un paciente con un DNI específico.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de citas obtenida exitosamente"),
            @ApiResponse(responseCode = "404", description = "No se encontraron citas para el paciente con ese DNI")
    })
    @GetMapping("/paciente/{dniPaciente}")
    public List<Cita> getCitasByDniPaciente(@PathVariable String dniPaciente) {
        return citaService.getCitasByDniPaciente(dniPaciente);
    }
}


