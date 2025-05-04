package com.example.demo.HistoriaClinica.application;

import com.example.demo.HistoriaClinica.domain.HistoriaClinica;
import com.example.demo.HistoriaClinica.domain.HistoriaClinicaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/historias-clinicas")
public class HistoriaClinicaController {

    @Autowired
    private HistoriaClinicaService historiaClinicaService;

    // Obtener todas las historias clínicas
    @Operation(summary = "Obtener todas las historias clínicas", description = "Devuelve una lista con todas las historias clínicas registradas.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Lista de historias clínicas obtenida exitosamente"),
            @ApiResponse(responseCode = "404", description = "No se encontraron historias clínicas")
    })
    @GetMapping
    public List<HistoriaClinica> getAllHistoriasClinicas() {
        return historiaClinicaService.getAllHistoriasClinicas();
    }

    // Obtener una historia clínica por DNI de paciente
    @Operation(summary = "Obtener una historia clínica por DNI de paciente", description = "Devuelve una historia clínica asociada a un paciente basado en su DNI.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Historia clínica obtenida exitosamente"),
            @ApiResponse(responseCode = "404", description = "Historia clínica no encontrada")
    })
    @GetMapping("/{dniPaciente}")
    public Optional<HistoriaClinica> getHistoriaClinicaByDniPaciente(@PathVariable String dniPaciente) {
        return historiaClinicaService.getHistoriaClinicaByDniPaciente(dniPaciente);
    }

    // Crear una nueva historia clínica
    @Operation(summary = "Crear una nueva historia clínica", description = "Crea una nueva historia clínica para un paciente.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Historia clínica creada exitosamente"),
            @ApiResponse(responseCode = "400", description = "Solicitud incorrecta")
    })
    @PostMapping
    public HistoriaClinica createHistoriaClinica(@RequestBody HistoriaClinica historiaClinica) {
        return historiaClinicaService.saveHistoriaClinica(historiaClinica);
    }

    // Eliminar una historia clínica
    @Operation(summary = "Eliminar una historia clínica", description = "Elimina una historia clínica específica asociada al DNI del paciente.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Historia clínica eliminada exitosamente"),
            @ApiResponse(responseCode = "404", description = "Historia clínica no encontrada")
    })
    @DeleteMapping("/{dniPaciente}")
    public void deleteHistoriaClinica(@PathVariable String dniPaciente) {
        historiaClinicaService.deleteHistoriaClinica(dniPaciente);
    }
}


