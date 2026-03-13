const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const centros = [
  "Centro Industrial",
  "Centro Tecnológico",
  "Centro Agropecuario",
  "Centro de Servicios"
]

const programas = [
  { nombre: "Análisis y Desarrollo de Software", nivel: "Tecnólogo" },
  { nombre: "Sistemas", nivel: "Técnico" },
  { nombre: "Contabilidad", nivel: "Tecnólogo" },
  { nombre: "Electricidad Industrial", nivel: "Técnico" },
  { nombre: "Mecánica Industrial", nivel: "Técnico" },
  { nombre: "Gestión Administrativa", nivel: "Tecnólogo" }
]

const nombres = ["Juan","Carlos","Luis","Pedro","Andres","Daniel","Maria","Ana","Sofia","Laura"]
const apellidos = ["Perez","Ramirez","Gomez","Lopez","Rodriguez","Torres","Martinez","Garcia"]

function nombreRandom() {
  return nombres[random(0,nombres.length-1)]
}

function apellidoRandom() {
  return apellidos[random(0,apellidos.length-1)]
}

function calcularRiesgo(horas){

  if(horas >= 35){
    return { riesgo:"RIESGO ALTO", prob:0.8 + Math.random()*0.2 }
  }

  if(horas >= 20){
    return { riesgo:"RIESGO MEDIO", prob:0.5 + Math.random()*0.3 }
  }

  if(horas >= 5){
    return { riesgo:"RIESGO BAJO", prob:0.2 + Math.random()*0.3 }
  }

  return { riesgo:"SIN PREDICCION", prob:null }
}

async function main(){

  console.log("Creando centros...")

  const centrosDB = []

  for(const c of centros){

    const centro = await prisma.cENTRO.create({
      data:{
        descripcion:c
      }
    })

    centrosDB.push(centro)
  }

  console.log("Creando programas...")

  const programasDB = []

  for(const centro of centrosDB){

    for(const p of programas){

      const prog = await prisma.pROGRAMA.create({
        data:{
          nombre:p.nombre,
          nivel:p.nivel,
          descripcion:"Programa generado para pruebas",
          centroId:centro.idCENTRO
        }
      })

      programasDB.push(prog)
    }

  }

  console.log("Creando aprendices...")

  for(let i=1;i<=1000;i++){

    const programa = programasDB[random(0,programasDB.length-1)]

    const horas = random(0,50)

    const aprendiz = await prisma.aPRENDIZ.create({
      data:{
        idAPRENDIZ:10000+i,
        tipoDocumento:"CC",
        nombre:nombreRandom(),
        apellidos:apellidoRandom(),
        horas_inasistidas:horas,
        programaId:programa.idPROGRAMA
      }
    })

    const riesgoData = calcularRiesgo(horas)

    await prisma.pREDICCION_DESERCION.create({
      data:{
        riesgo:riesgoData.riesgo,
        probabilidad:riesgoData.prob,
        aprendizId:aprendiz.idAPRENDIZ
      }
    })

  }

  console.log("Datos demo generados correctamente")

}

main()
  .catch(e=>console.error(e))
  .finally(()=>prisma.$disconnect())