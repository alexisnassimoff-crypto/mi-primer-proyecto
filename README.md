# mi-primer-proyecto

## Tutorial: Como crear Skills en Claude Code

### Que es una Skill?

Una skill es un archivo `SKILL.md` que le da instrucciones a Claude Code para realizar
tareas especificas. Piensa en ellas como "recetas" que Claude sigue cuando las necesitas.

### Estructura basica

```
tu-proyecto/
└── .claude/
    └── skills/
        └── nombre-de-skill/
            └── SKILL.md        <-- archivo principal (obligatorio)
```

### Anatomia de un SKILL.md

```yaml
---
# === FRONTMATTER (configuracion, opcional) ===
name: mi-skill                  # nombre para invocar con /mi-skill
description: Que hace esta skill  # Claude lo usa para saber cuando activarla
argument-hint: "[parametro]"    # pista de que argumentos acepta
---

# === CONTENIDO (instrucciones, obligatorio) ===

Aqui van las instrucciones en Markdown que Claude seguira
cuando la skill sea invocada.
```

### Campos del Frontmatter

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `name` | string | Nombre de la skill (minusculas, guiones). Se usa como `/comando` |
| `description` | string | Que hace y cuando usarla. Claude lo lee para decidir si activarla |
| `argument-hint` | string | Pista para autocompletado (ej: `[archivo]`) |
| `allowed-tools` | string | Herramientas permitidas (ej: `Read, Grep, Glob`) |
| `disable-model-invocation` | boolean | `true` = solo se activa manualmente con `/` |
| `user-invocable` | boolean | `false` = no aparece en el menu `/` |
| `context` | string | `fork` = ejecutar en un subagente aislado |

### Variables disponibles en el contenido

| Variable | Descripcion |
|----------|-------------|
| `$ARGUMENTS` | Todos los argumentos pasados al invocar |
| `$0`, `$1`, `$2` | Argumentos individuales por posicion |
| `${CLAUDE_SESSION_ID}` | ID de la sesion actual |
| `${CLAUDE_SKILL_DIR}` | Directorio donde esta el SKILL.md |

### Donde guardar las skills

| Ubicacion | Ruta | Alcance |
|-----------|------|---------|
| Personal | `~/.claude/skills/nombre/` | Todos tus proyectos |
| Proyecto | `.claude/skills/nombre/` | Solo este proyecto |

### Como usar una skill

```bash
# Invocar manualmente desde Claude Code:
/saludar Juan

# Invocar la skill de revision:
/revisar-codigo src/
```

### Skills incluidas en este proyecto

1. **`/saludar`** - Skill basica de ejemplo. Saluda al usuario con un dato curioso.
2. **`/revisar-codigo`** - Skill avanzada. Revisa calidad y seguridad del codigo.

### Tips

- Manten el `SKILL.md` por debajo de 500 lineas
- Usa `description` descriptivo para que Claude sepa cuando activarla automaticamente
- Usa `allowed-tools` para limitar que puede hacer la skill
- Usa `disable-model-invocation: true` para skills con efectos secundarios (deploy, etc.)
