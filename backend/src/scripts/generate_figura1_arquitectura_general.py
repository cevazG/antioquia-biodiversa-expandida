"""
generate_figura1_arquitectura_general.py
Genera el diagrama de Arquitectura General (Figura 1 del Documento Integral
de Desarrollo) con graphviz. Reemplaza la versión anterior, que agrupaba
MongoDB y Redis en una misma caja "Persistencia" sin distinguir que Redis
corre en el mismo servidor institucional y MongoDB Atlas es un proveedor
externo (hallazgo Moderado de TI, Revisión 3) — y no anotaba que la
migración a Microsoft Entra ID es un pendiente a futuro, a diferencia de la
Figura 3 (hallazgo Menor).

No existía un script fuente versionado para este diagrama antes de este
(era un PNG suelto, editado a mano fuera del repo) — este script es ahora
la fuente de verdad; para actualizar el diagrama, editar aquí y volver a
correr.

Requiere: pip install graphviz + brew install graphviz (binario `dot`).

Uso: python3 src/scripts/generate_figura1_arquitectura_general.py
"""
import graphviz

GREEN = '#4B8039'
GREEN_FILL = '#E8F5E9'
BLUE_FILL = '#E3F2FD'
PURPLE_FILL = '#F3E5F5'
AMBER_BORDER = '#B8860B'  # mismo AMBER institucional de lib/docx_helpers.js
AMBER_BG = '#FFF3E0'
NODE_FILL = '#FFFFFF'

OUT_DIR = '../../../Documentos gobernacion/TI/REVISION 2/diagramas'
OUT_NAME = 'arquitectura_general'


def build():
    g = graphviz.Digraph('figura1', format='png')
    g.attr(rankdir='TB', splines='spline', bgcolor='white', fontname='Helvetica',
           margin='0.15', nodesep='0.45', ranksep='0.55')
    g.attr('node', fontname='Helvetica', fontsize='11', shape='box', style='filled',
           color=GREEN, fillcolor=NODE_FILL, margin='0.15,0.1')
    g.attr('edge', color=GREEN, fontname='Helvetica', fontsize='10')

    g.node('cliente', 'Ciudadano / Curador\nnavegador móvil vía QR', fillcolor=GREEN_FILL)

    # ── Todo lo que corre en el servidor institucional ──
    with g.subgraph(name='cluster_servidor') as s:
        s.attr(label='Servidor Gobernación — Ubuntu 24.04 LTS', fontname='Helvetica-Bold',
               fontsize='11', color=GREEN, style='filled', fillcolor=GREEN_FILL, margin='16')

        with s.subgraph(name='cluster_frontend') as fe:
            fe.attr(label='Frontend estático — servido por Nginx', fontname='Helvetica-Bold',
                    fontsize='10', color=GREEN, style='filled', fillcolor=GREEN_FILL, margin='12')
            fe.node('frontend', 'Biodiversidad / Agua /\nComunidad\nlee JSON estático\ndirectamente')
            fe.node('panel', 'Panel Admin')

        with s.subgraph(name='cluster_backend') as be:
            be.attr(label='Backend — Node.js 22 + Express (contenedor Docker)', fontname='Helvetica-Bold',
                    fontsize='10', color=GREEN, style='filled', fillcolor=BLUE_FILL, margin='12')
            be.node('api', 'API REST /api')
            be.node('auth', 'Auth — usuarios individuales\n+ roles · requestLogger')
            be.node('servicios', 'Capa de Servicios')
            be.edge('api', 'auth')
            be.edge('auth', 'servicios')

        # Redis vive en el mismo servidor — dentro de la caja del servidor,
        # no agrupado con MongoDB (que sí es externo, ver abajo).
        s.node('redis', 'Redis 7\ncaché de consultas\n(mismo servidor)', shape='cylinder', fillcolor=GREEN_FILL)
        s.edge('panel', 'api', label='login + CRUD fotos', fontcolor='#8A5300')

    g.edge('cliente', 'frontend')
    g.edge('cliente', 'panel')
    g.edge('servicios', 'redis')

    # Entra ID — anotación explícita de pendiente (conector punteado ámbar),
    # mismo tratamiento visual que usa la Figura 3 para pendientes de TI.
    g.node('entraid', 'Microsoft Entra ID\n(pendiente — insumo TI:\nClient ID / Tenant ID)',
           shape='box', style='dashed,filled', color=AMBER_BORDER, fillcolor=AMBER_BG, fontsize='10')
    g.edge('auth', 'entraid', style='dashed', color=AMBER_BORDER, label='a futuro', fontcolor=AMBER_BORDER)

    # Proveedores externos — fuera del servidor institucional.
    g.node('mongo', 'MongoDB Atlas\nBD Comunidad\n(proveedor externo)', shape='cylinder', fillcolor=PURPLE_FILL)
    g.node('inaturalist', 'API iNaturalist\n(servicio externo)', fillcolor=PURPLE_FILL)
    g.edge('servicios', 'mongo')
    g.edge('servicios', 'inaturalist')

    return g


if __name__ == '__main__':
    import os
    out_dir = os.path.join(os.path.dirname(__file__), OUT_DIR)
    g = build()
    g.render(os.path.join(out_dir, OUT_NAME), cleanup=True)
    print('OK ->', os.path.join(out_dir, OUT_NAME + '.png'))
