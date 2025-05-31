const prisma = require('../../config/prisma');


const findAll = async () => {
  try {
    return await prisma.carro.findMany({
      select: {
        id: true,
        modelo: true,
        marca: true,
        asientos:true,
        puertas:true,
        transmicion:true,
        CombustibleCarro:{
            select:{
              TipoCombustible:{
              select:{
                tipoDeCombustible:true,
              }
            },
          },},
        Usuario:{
          select:{
            id:true,
            nombre:true,
          }
        },
        Direccion: {
          select:{
              calle:true,
              Provincia:{
                  select:{
                    Ciudad:{
                          select:{
                              nombre:true,
                          }
                      }
                  },
              },
          },
        },
        Imagen : {
            take: 1,
            orderBy: {
              id: 'asc'
            },
            select: {
                id: true,
                data: true,
                id_carro: true
            }
        },
    }
    });
  } catch (error) {
    console.error('Error al obtener los carros:', error);
  }
};

module.exports = { findAll };
