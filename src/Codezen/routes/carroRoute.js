const express = require('express');
const { prisma } = require('../lib/prisma');

const router = express.Router();

router.get('/:hostId', async (req, res) => {
    const { hostId } = req.params;
    
    try {
      
      const hostIdNum = parseInt(hostId, 2);
      
      if (isNaN(hostIdNum)) {
        return res.status(400).json({
          error: "ID de host inválido",
          details: "El ID debe ser un número"
        });
      }
      
      const cars = await prisma.carro.findMany({
        where: {
          id_usuario_rol: hostIdNum 
        },
        select: {
          id: true,
          vim: true,
          año: true,
          marca: true,
          modelo: true,
          placa: true,
          asientos: true,
          puertas: true,
          soat: true,
          precio_por_dia: true,
          num_mantenimientos: true,
          transmicion: true,
          estado: true,
          Direccion: {
            select: {
              calle: true,
              num_casa: true,
              Provincia: {
                select: {
                  nombre: true,
                  Ciudad: {
                    select: {
                      nombre: true,
                      Pais: {
                        select: {
                          nombre: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          CombustibleCarro: { 
            select: { 
              TipoCombustible: { 
                select: { tipoDeCombustible: true } 
              } 
            } 
          },
          caracteristicasAdicionalesCarro: { 
            select: { 
              CarasteristicasAdicionales: { 
                select: { nombre: true } 
              } 
            } 
          },
          Imagen: { select: { data: true, public_id: true } }
        }
      });
  
      if (!cars.length) {
        return res.status(404).json({ 
          message: "No se encontraron autos para este host",
          hostId
        });
      }
  
      const formattedCars = cars.map(car => {
        
        const caracteristicas = car.caracteristicasAdicionalesCarro.map(c => 
          c.CarasteristicasAdicionales.nombre);
        
        
        const combustibles = car.CombustibleCarro.map(c => 
          c.TipoCombustible.tipoDeCombustible);
        
       
        const imagenes = car.Imagen.map(img => ({
          url: img.data,
          public_id: img.public_id
        }));
        
        return {
          id: car.id,
          vim: car.vim,
          año: car.año,
          marca: car.marca,
          modelo: car.modelo,
          placa: car.placa,
          asientos: car.asientos,
          puertas: car.puertas,
          soat: car.soat,
          precio_por_dia: car.precio_por_dia,
          num_mantenimientos: car.num_mantenimientos || 0,
          transmision: car.transmicion || 'No especificado',
          estado: car.estado === 'DISPONIBLE' ? 'Disponible' : 
                 car.estado === 'RESERVADO' ? 'Reservado' : 'En mantenimiento',
          direccion: car.Direccion?.calle,
          ciudad: car.Direccion?.Provincia?.Ciudad?.nombre,
          provincia: car.Direccion?.Provincia?.nombre,
          pais: car.Direccion?.Provincia?.Ciudad?.Pais?.nombre,
          combustibles,
          caracteristicas,
          imagenes,
          tiene_placa: !!car.placa 
        };
      });
  
      res.json({
        total: cars.length,
        autos_con_placa: cars.filter(c => c.placa).length,
        autos: formattedCars
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ 
        error: "Error en el servidor",
        details: process.env.NODE_ENV === 'development' ? {
          message: error.message,
          stack: error.stack
        } : null
      });
    }
});

router.get('/inactivos/:hostId', async (req, res) => {
    const { hostId } = req.params;

    try {
        const hostIdNum = parseInt(hostId, 10);

        if (isNaN(hostIdNum)) {
            return res.status(400).json({
                error: "ID de host inválido",
                details: "El ID debe ser un número"
            });
        }

        
        const inactiveCars = await prisma.carro.count({
            where: {
                id_usuario_rol: hostIdNum,
                Reserva: {
                    none: {
                        OR: [
                            { fecha_fin: { gte: new Date() } }, 
                            { fecha_inicio: { gte: new Date() }, estado: { notIn: ['COMPLETADA', 'CANCELADA'] } } 
                        ]
                    }
                }
            }
        });

        res.json({ count: inactiveCars });

    } catch (error) {
        console.error("Error al obtener vehículos inactivos:", error);
        res.status(500).json({
            error: "Error en el servidor al obtener vehículos inactivos",
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : null
        });
    }
});


router.get('/inactivos-list/:hostId', async (req, res) => {
    const { hostId } = req.params;

    try {
        const hostIdNum = parseInt(hostId, 10);

        if (isNaN(hostIdNum)) {
            return res.status(400).json({
                error: "ID de host inválido",
                details: "El ID debe ser un número"
            });
        }

        
        const inactiveCarsList = await prisma.carro.findMany({
            where: {
                id_usuario_rol: hostIdNum,
                Reserva: {
                    none: { 
                        OR: [
                            { fecha_fin: { gte: new Date() } }, 
                            { fecha_inicio: { gte: new Date() }, estado: { notIn: ['COMPLETADA', 'CANCELADA'] } } 
                        ]
                    }
                }
            },
            
             select: {
                id: true,
                marca: true,
                modelo: true,
                placa: true,
              }
        });

        res.json(inactiveCarsList); 

    } catch (error) {
        console.error("Error al obtener la lista de vehículos inactivos:", error);
        res.status(500).json({
            error: "Error en el servidor al obtener la lista de vehículos inactivos",
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : null
        });
    }
});


module.exports = router;