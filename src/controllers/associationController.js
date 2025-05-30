const { PrismaClient } = require('@prisma/client');
const e = require('express');
const { collapseTextChangeRangesAcrossMultipleVersions } = require('typescript');
const prisma = new PrismaClient();


exports.listUsersDrivers = async (req, res) => {
  const id_usuario = req.user.id;
  const { search } = req.body;
  
  try {
    // Obtener asociaciones activas Y solicitudes pendientes
    const [existingAssociations, pendingRequests] = await Promise.all([
      prisma.Asociacion.findMany({
        where: {
          renterId: id_usuario,
          activa: true
        },
        select: { driverId: true }
      }),
      prisma.SolicitudAsociacion.findMany({
        where: {
          solicitanteId: id_usuario,
          estado: 'PENDIENTE'
        },
        select: { receptorId: true }
      })
    ]);

    // Combinar IDs excluidos
    const excludedDriverIds = [
      ...existingAssociations.map(a => a.driverId),
      ...pendingRequests.map(r => r.receptorId)
    ].filter((v, i, a) => a.indexOf(v) === i); // Eliminar duplicados
    console.log(excludedDriverIds);
    // Construir condiciones base
    const baseConditions = {
      roles: {
        some: {
          rol: {
            rol: 'DRIVER'
          }
        }
      },
      NOT: {
        id: {
          in: excludedDriverIds
        }
      }
    };

    // Construir condiciones de búsqueda
    let searchConditions = {};
    if (search && search.trim() !== '') {
      searchConditions = {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { correo: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const drivers = await prisma.Usuario.findMany({
      where: {
        AND: [
          baseConditions,
          searchConditions
        ]
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        foto: true
      },
      take: search ? undefined : 10, // Limitar a 10 solo sin búsqueda
      orderBy: {
        nombre: 'asc'
      }
    });
    res.status(200).json({drivers});
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listUsersRenters = async (req, res) => {
  const id_usuario = req.user.id;
  const { search } = req.body;
  
  try {
    // Obtener asociaciones activas Y solicitudes pendientes
    const [existingAssociations, pendingRequests] = await Promise.all([
      prisma.Asociacion.findMany({
        where: {
          driverId: id_usuario,
          activa: true
        },
        select: { renterId: true }
      }),
      prisma.SolicitudAsociacion.findMany({
        where: {
          solicitanteId: id_usuario,
          estado: 'PENDIENTE'
        },
        select: { receptorId: true }
      })
    ]);

    // Combinar IDs excluidos
    const excludedRenterIds = [
      ...existingAssociations.map(a => a.renterId),
      ...pendingRequests.map(r => r.receptorId)
    ].filter((v, i, a) => a.indexOf(v) === i); // Eliminar duplicados
    console.log(excludedRenterIds);
    // Construir condiciones base
    const baseConditions = {
      roles: {
        some: {
          rol: {
            rol: 'RENTER'
          }
        }
      },
      NOT: {
        id: {
          in: excludedRenterIds
        }
      }
    };

    // Construir condiciones de búsqueda
    let searchConditions = {};
    if (search && search.trim() !== '') {
      searchConditions = {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { correo: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const renters = await prisma.Usuario.findMany({
      where: {
        AND: [
          baseConditions,
          searchConditions
        ]
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        foto: true
      },
      take: search ? undefined : 10, // Limitar a 10 solo sin búsqueda
      orderBy: {
        nombre: 'asc'
      }
    });
    res.status(200).json({renters: renters || []});
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.listAssociationRequests = async (req, res) => {
  const id_usuario = req.user.id;
  try {
    const requests = await prisma.SolicitudAsociacion.findMany({
      where: {
        receptorId: id_usuario,
        estado: 'PENDIENTE'
      }
    });
    //usuarios solicitantes
    const requesterIds = requests.map(request => request.solicitanteId);
    const requesters = await prisma.Usuario.findMany({  
      where: {
        id: { in: requesterIds }
      },
      select: {
        nombre: true,
        correo: true,
        foto: true,
        telefono: true,
      }
    });
    res.status(200).json({ requests, requesters });
  } catch (error) {
    console.error('Error fetching association requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.changeAssociationRequestState = async (req, res) => {
  const id_usuario = req.user.id;
  const { id_solicitud, estado } = req.body;

  try {
    // Check if the request exists and belongs to the user
    const request = await prisma.SolicitudAsociacion.findUnique({
      where: { id: id_solicitud },
      select: { receptorId: true, solicitanteId: true, tipo: true }
    });

    if (!request || request.receptorId !== id_usuario) {
      return res.status(404).json({ message: 'Solicitud no encontrada o no pertenece al usuario.' });
    }
    console.log(estado)
    // Update the state of the request
    const updatedRequest = await prisma.SolicitudAsociacion.update({
      where: { id: id_solicitud },
      data: { estado }
    });
    if (estado === 'APROBADA') {
      if (request.tipo !== 'RENTER_A_DRIVER') {
        const association = await prisma.Asociacion.create({
          data: {
            renterId: request.receptorId,
            driverId: request.solicitanteId,
          }
        });
        console.log('Association created:', association);
      }else if (request.tipo !== 'DRIVER_A_RENTER') {
        const association = await prisma.Asociacion.create({
          data: {
            renterId: request.solicitanteId,
            driverId: request.receptorId
          }
        });
        console.log('Association created:', association);
      }
    }
    res.status(200).json(updatedRequest);
  } catch (error) {
    console.error('Error updating association request state:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.associationRequestRenterToDriver = async (req, res) => {
  const id_solicitante = req.user.id;
  let {id_receptor, mensaje} = req.body;
  id_receptor = parseInt(id_receptor);
  if (!id_receptor) {
    return res.status(400).json({ message: 'El id del receptor es requerido.' });
  }
  try {
    // Check if the requester is a renter
    const requester = await prisma.Usuario.findUnique({
      where: { id: id_solicitante },
      select: {
        roles: {
          select: {
            rol: {
              select: {
                rol: true
              }
            }
          }
        }
      },
    });
    const isRenter = requester.roles.some(userRole => userRole.rol.rol === 'RENTER');
    if (!isRenter) {
      return res.status(403).json({ message: 'Only renters can create association requests.' });
    }
    
    // Check if the driver is a driver
    const receiver = await prisma.Usuario.findUnique({
      where: { id: id_receptor },
      select: { 
        roles: {
          select: {
            rol: {
              select: {
                rol: true
              }
            }
          }
        }
      },
    });
    const isDriver = receiver.roles.some(userRole => userRole.rol.rol === 'DRIVER');
    if (!isDriver) {
      return res.status(403).json({ message: 'Only drivers can receive association requests.' });
    }
    mensaje = mensaje || 'Solicitud de asociación';
    const newRequest = await prisma.SolicitudAsociacion.create({
      data: {
        solicitanteId: id_solicitante,
        receptorId: id_receptor,
        tipo: 'RENTER_A_DRIVER',
        mensaje: mensaje
      },
    });
    res.status(201).json(newRequest);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Solicitud duplicada' });
    }
    console.error('Error creating association request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.associationRequestDriverToRenter = async (req, res) => {
  const id_solicitante = req.user.id;
  let {id_receptor, mensaje} = req.body;
  id_receptor = parseInt(id_receptor);
  try {
    // Check if the requester is a driver
    const requester = await prisma.Usuario.findUnique({
      where: { id: id_solicitante },
      select: { 
        roles: {
          select: {
            rol: {
              select: {
                rol: true
              }
            }
          }
        }
      },
    });
    const isDriver = requester.roles.some(userRole => userRole.rol.rol === 'DRIVER');
    if (!isDriver) {
      return res.status(403).json({ message: 'Only drivers can create association requests.' });
    }

    // Check if the renter is a renter
    const receiver = await prisma.Usuario.findUnique({
      where: { id: id_receptor },
      select: {
        roles: {
          select: {
            rol: {
              select: {
                rol: true
              }
            }
          }
        }
      },
    });
    const isRenter = receiver.roles.some(userRole => userRole.rol.rol === 'RENTER');
    if (!isRenter) {
      return res.status(403).json({ message: 'Only renters can receive association requests.' });
    }
    mensaje = mensaje || 'Solicitud de asociación';
    const newRequest = await prisma.SolicitudAsociacion.create({
      data: {
        solicitanteId: id_solicitante,
        receptorId: id_receptor,
        tipo: 'DRIVER_A_RENTER',
        mensaje: mensaje
      },
    });
    res.status(201).json(newRequest);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Solicitud duplicada' });
    }
    console.error('Error creating association request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


exports.listPartners = async (req, res) => {
  const id_usuario = req.user.id;
  try {
    // Obtener asociaciones activas
    const associations = await prisma.Asociacion.findMany({
      where: {
        OR: [
          { renterId: id_usuario },
          { driverId: id_usuario }
        ],
        activa: true
      },
      select: {
        renterId: true,
        driverId: true
      }
    });

    // Extraer IDs de socios
    const partnerIds = associations.flatMap(a => [a.renterId, a.driverId]);
    const uniquePartnerIds = [...new Set(partnerIds)].filter(id => id !== id_usuario); // Excluir el propio usuario

    // Obtener detalles de los socios
    const partners = await prisma.Usuario.findMany({
      where: {
        id: { in: uniquePartnerIds }
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        foto: true,
        telefono: true,
        roles: {
          select: {
            rol: {
              select: {
                rol: true,
              },
            },
          },
        },
      }
    });
    const transformedPartners = partners.map(partner => ({
      ...partner,
      roles: partner.roles.map(r => r.rol.rol) // Extraer solo los nombres de los roles
    }));
    res.status(200).json({ partners: transformedPartners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}


exports.listPartnersDrivers = async (req, res) => {
  const id_usuario = req.user.id;
  try {
    // Obtener asociaciones activas
    const associations = await prisma.Asociacion.findMany({
      where: {
        renterId: id_usuario,
        activa: true
      },
      select: {
        driverId: true
      }
    });

    // Extraer IDs de socios
    const partnerIds = associations.map(a => a.driverId);
    const uniquePartnerIds = [...new Set(partnerIds)].filter(id => id !== id_usuario); // Excluir el propio usuario

    // Obtener detalles de los socios
    const partners = await prisma.Usuario.findMany({
      where: {
        id: { in: uniquePartnerIds }
      },
      orderBy: { // 👈 Nuevo parámetro para ordenamiento
        nombre: 'asc' // 'asc' para ascendente, 'desc' para descendente
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        foto: true,
        telefono: true,
        roles: {
          select: {
            rol: {
              select: {
                rol: true,
              },
            },
          },
        },
      }
    });
    const transformedPartners = partners.map(partner => ({
      ...partner,
      roles: partner.roles.map(r => r.rol.rol) // Extraer solo los nombres de los roles
    }));
    res.status(200).json({ partners: transformedPartners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.listPartnersRenters = async (req, res) => {
  const id_usuario = req.user.id;
  try {
    // Obtener asociaciones activas
    const associations = await prisma.Asociacion.findMany({
      where: {
        driverId: id_usuario,
        activa: true
      },
      select: {
        renterId: true
      }
    });

    // Extraer IDs de socios
    const partnerIds = associations.map(a => a.renterId);
    const uniquePartnerIds = [...new Set(partnerIds)].filter(id => id !== id_usuario); // Excluir el propio usuario

    // Obtener detalles de los socios
    const partners = await prisma.Usuario.findMany({
      where: {
        id: { in: uniquePartnerIds }
      },
      orderBy: { // 👈 Nuevo parámetro para ordenamiento
        nombre: 'asc' // 'asc' para ascendente, 'desc' para descendente
      },
      select: {
        id: true,
        nombre: true,
        correo: true,
        foto: true,
        telefono: true,
        roles: {
          select: {
            rol: {
              select: {
                rol: true,
              },
            },
          },
        },
      }
    });
    const transformedPartners = partners.map(partner => ({
      ...partner,
      roles: partner.roles.map(r => r.rol.rol) // Extraer solo los nombres de los roles
    }));
    res.status(200).json({ partners: transformedPartners });
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}