const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const centros = [
  "Centro Industrial",
  "Centro Tecnológico"
]

const programas = [
  { nombre: "Análisis y Desarrollo de Software", nivel: "Tecnólogo" },
  { nombre: "Sistemas", nivel: "Técnico" },
  { nombre: "Contabilidad", nivel: "Tecnólogo" },
  { nombre: "Electricidad Industrial", nivel: "Técnico" },
  { nombre: "Mecánica Industrial", nivel: "Técnico" },
  { nombre: "Gestión Administrativa", nivel: "Tecnólogo" },
  { nombre: "Diseño Gráfico", nivel: "Tecnólogo" },
  { nombre: "Cocina", nivel: "Técnico" },
  { nombre: "Enfermería", nivel: "Técnico" },
  { nombre: "Construcción", nivel: "Técnico" },
  { nombre: "Animación 3D", nivel: "Tecnólogo" },
  { nombre: "Soldadura", nivel: "Técnico" },
  { nombre: "Panadería", nivel: "Técnico" },
  { nombre: "Producción Multimedia", nivel: "Tecnólogo" }
]

const nombres = ["Juan","Carlos","Luis","Pedro","Andres","Daniel","Maria","Ana","Sofia","Laura", "Diana", "Mateo"]
const apellidos = ["Perez","Ramirez","Gomez","Lopez","Rodriguez","Torres","Martinez","Garcia", "Hernandez", "Diaz"]
const barrios = ["Suba", "Kennedy", "Usaquén", "Chapinero", "Bosa", "Fontibón", "Engativá"]
const instituciones = ["Colegio A", "Colegio B", "Colegio C", "SENA", "Instituto Técnico"]

function nombreRandom() { return nombres[random(0,nombres.length-1)] }
function apellidoRandom() { return apellidos[random(0,apellidos.length-1)] }
function barrioRandom() { return barrios[random(0,barrios.length-1)] }
function institucionRandom() { return instituciones[random(0,instituciones.length-1)] }

function calcularRiesgo(horas){
  if(horas >= 35) return { riesgo:"RIESGO ALTO", prob:0.8 + Math.random()*0.2 }
  if(horas >= 20) return { riesgo:"RIESGO MEDIO", prob:0.5 + Math.random()*0.3 }
  if(horas >= 5)  return { riesgo:"RIESGO BAJO", prob:0.2 + Math.random()*0.3 }
  return { riesgo:"SIN PREDICCION", prob:null }
}

async function main(){
  console.log("Limpiando base de datos...")
  // Clean in specific order to avoid foreign key constraints
  await prisma.pREDICCION_DEMANDA.deleteMany()
  await prisma.pREDICCION_DESERCION.deleteMany()
  await prisma.aPRENDIZ.deleteMany()
  await prisma.rECOMENDACION.deleteMany()
  await prisma.rESPUESTAS_ASPIRANTE.deleteMany()
  await prisma.rEPORTE.deleteMany()
  await prisma.pREGUNTAS.deleteMany()
  await prisma.tEST.deleteMany()
  await prisma.aSPIRANTE.deleteMany()
  await prisma.pROGRAMA.deleteMany()
  await prisma.aMBIENTE.deleteMany()
  await prisma.cENTRO.deleteMany()

  console.log("Creando centros y programas...")
  const centrosDB = []
  for(const c of centros){
    const centro = await prisma.cENTRO.create({ data:{ descripcion:c } })
    centrosDB.push(centro)
  }

  const programasDB = []
  for(let i=0; i < programas.length; i++){
    const p = programas[i]
    // distribute programs evenly
    const centro = centrosDB[i % centrosDB.length]
    const prog = await prisma.pROGRAMA.create({
      data:{
        nombre: p.nombre,
        nivel: p.nivel,
        descripcion: "Programa generado para pruebas",
        centroId: centro.idCENTRO
      }
    })
    programasDB.push(prog)
  }

  console.log("Creando aprendices (Demanda Real)...")
  for(let i=1; i<=1500; i++){
    const programa = programasDB[random(0,programasDB.length-1)]
    const horas = random(0,50)
    const estado = Math.random() > 0.3 ? "en formacion" : "desercion" // 30% desercion aparente
    
    const aprendiz = await prisma.aPRENDIZ.create({
      data:{
        idAPRENDIZ: 10000+i,
        tipoDocumento: "CC",
        nombre: nombreRandom(),
        apellidos: apellidoRandom(),
        estado: estado,
        horas_inasistidas: horas,
        programaId: programa.idPROGRAMA
      }
    })

    const riesgoData = calcularRiesgo(horas)
    await prisma.pREDICCION_DESERCION.create({
      data: {
        riesgo: riesgoData.riesgo,
        probabilidad: riesgoData.prob,
        aprendizId: aprendiz.idAPRENDIZ
      }
    })
  }

  console.log("Creando Aspirantes, Tests y Reportes (Interés Histórico)...")
  const testMain = await prisma.tEST.create({
    data: {
      nombre: "Test Vocacional Principal",
      descripcion: "Test oficial RIASEC de AVI"
    }
  })

  // Generar al menos 50 aspirantes por programa promedio para que el modelo funcione bien
  // Generaremos 800 aspirantes
  for(let i=1; i<=800; i++){
    const aspirante = await prisma.aSPIRANTE.create({
      data: {
        idASPIRANTE: 20000+i,
        nombre_completo: nombreRandom() + " " + apellidoRandom(),
        fechaNacimiento: new Date("2000-01-01"),
        email: `aspirante${i}@test.com`,
        telefono: "300000000",
        barrio: barrioRandom(),
        direccion: "Calle Falsa 123",
        ocupacion: "Estudiante",
        institucion: institucionRandom(),
        password: "hash"
      }
    })

    // Cada aspirante hace 1 reporte
    const reporte = await prisma.rEPORTE.create({
      data: {
        puntajeR: random(10, 50),
        puntajeI: random(10, 50),
        puntajeA: random(10, 50),
        puntajeS: random(10, 50),
        puntajeE: random(10, 50),
        puntajeC: random(10, 50),
        testId: testMain.idTEST,
        aspiranteId: aspirante.idASPIRANTE
      }
    })

    // El sistema le hace 3 recomendaciones (asignaremos aleatoriamente, priorizando 1 como elegida)
    const prog1 = programasDB[random(0,programasDB.length-1)]
    const prog2 = programasDB[random(0,programasDB.length-1)]
    
    // Recomendacion 1
    await prisma.rECOMENDACION.create({
      data: {
        nombre: "Sugerencia 1",
        descripcion: prog1.nombre,
        ranking: random(3, 5), // High score generally
        programaElegidoId: prog1.idPROGRAMA,
        reporteId: reporte.idREPORTE
      }
    })
    
    // Recomendacion 2
    await prisma.rECOMENDACION.create({
      data: {
        nombre: "Sugerencia 2",
        descripcion: prog2.nombre,
        ranking: random(1, 3), // Low score
        programaElegidoId: prog2.idPROGRAMA,
        reporteId: reporte.idREPORTE
      }
    })
  }

  console.log("Datos demo generados correctamente con esquema AI-Ready!")
}

main()
  .catch(e=>console.error(e))
  .finally(()=>prisma.$disconnect())