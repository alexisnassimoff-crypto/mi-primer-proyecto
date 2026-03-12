---
name: revisar-codigo
description: >
  Revisa el codigo del proyecto buscando problemas de calidad, seguridad y
  mejores practicas. Usar cuando el usuario pida revisar, auditar o analizar
  la calidad de su codigo.
argument-hint: "[archivo-o-directorio]"
allowed-tools: Read, Grep, Glob
---

# Skill: Revisar Codigo

Cuando el usuario invoque esta skill, sigue estos pasos:

## 1. Identificar el alcance

- Si `$ARGUMENTS` contiene una ruta, revisa solo ese archivo o directorio
- Si no hay argumentos, revisa los archivos modificados recientemente (usa `git diff` y `git status`)

## 2. Analizar el codigo

Para cada archivo, busca:

- **Seguridad**: inyecciones SQL, XSS, secrets hardcodeados, inputs sin validar
- **Calidad**: funciones muy largas (>50 lineas), codigo duplicado, nombres poco claros
- **Buenas practicas**: manejo de errores, tipos faltantes, imports no usados

## 3. Generar reporte

Presenta los hallazgos en este formato:

```
## Reporte de Revision

### Problemas Criticos (arreglar ya)
- [ ] Descripcion del problema - `archivo:linea`

### Mejoras Sugeridas (recomendado)
- [ ] Descripcion de la mejora - `archivo:linea`

### Notas Informativas
- Observacion general sobre el codigo
```

## 4. Reglas

- Responde siempre en espanol
- Se especifico: indica archivo y linea exacta
- No sugieras cambios cosmeticos a menos que el usuario lo pida
- Prioriza seguridad > correctitud > rendimiento > estilo
