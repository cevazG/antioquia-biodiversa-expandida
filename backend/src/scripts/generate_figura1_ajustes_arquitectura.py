"""
generate_figura1_ajustes_arquitectura.py
Genera el diagrama "Figura 1. Arquitectura general con los 3 ajustes técnicos
integrados" de la Propuesta Técnica y Financiera (numeral 3.1). Reemplaza la
versión anterior, que rotulaba el bloque de Redis como "catálogo en caché,
menos de 5 ms vs. 60-120 ms" — contradiciendo la tabla de Stack Tecnológico
(numeral 2.2, fila "Caché (AJUSTE 2)"), ya corregida para decir que Redis
cachea las lecturas del panel de administración, no el catálogo de especies
(hallazgo Crítico, Verificación Final v3).

No existía una fuente editable versionada para este diagrama antes de esto
(PNG suelto en REVISION 2/diagramas/, editado fuera del repo) — este script
es ahora la fuente de verdad, siguiendo el mismo patrón que
generate_figura1_arquitectura_general.py (Figura 1 del Documento Integral).

Requiere: pip install graphviz + brew install graphviz (binario `dot`).

Uso: python3 src/scripts/generate_figura1_ajustes_arquitectura.py
"""
import graphviz

GREEN = '#4B8039'
GREEN_FILL = '#E8F5E9'
BLUE_FILL = '#E3F2FD'
PURPLE_FILL = '#F3E5F5'
PINK_FILL = '#FCE4EC'
PINK_BORDER = '#AD1457'
AMBER_BORDER = '#B8860B'
AMBER_BG = '#FFF3E0'

OUT_DIR = '../../../Documentos gobernacion/TI/REVISION 2/diagramas'
OUT_NAME = 'ajustes_arquitectura'


def build():
    g = graphviz.Digraph('figura1_ajustes', format='png')
    g.attr(rankdir='TB', splines='spline', bgcolor='white', fontname='Helvetica',
           margin='0.15', nodesep='0.45', ranksep='0.55')
    g.attr('node', fontname='Helvetica', fontsize='11', shape='box', style='filled',
           color=GREEN, fillcolor='white', margin='0.15,0.1')
    g.attr('edge', color=GREEN, fontname='Helvetica', fontsize='10')

    g.node('curador', 'Curador', fillcolor=GREEN_FILL)
    g.node('entraid', '\U0001F511 Microsoft Entra ID\nAJUSTE 1, reemplaza login propio',
           fillcolor=AMBER_BG, color=AMBER_BORDER)
    g.edge('curador', 'entraid', label='OAuth 2.0 + OIDC\n(PKCE)', fontcolor='#8A5300')

    with g.subgraph(name='cluster_devops') as c:
        c.attr(label='Azure DevOps, Pipeline CI/CD', fontname='Helvetica-Bold',
               fontsize='11', color=GREEN, style='filled', fillcolor=BLUE_FILL, margin='16')
        c.node('sast', '\U0001F6E1 ESLint-security +\nSemgrep\nAJUSTE 3, falla el build si\nhallazgo Alto/Crítico\nOWASP',
               fillcolor=PINK_FILL, color=PINK_BORDER)

    g.node('api', 'API REST /api\n(Express)', fillcolor=GREEN_FILL)
    g.edge('entraid', 'api', label='JWT', fontcolor='#8A5300')
    g.edge('sast', 'api', label='cada push', style='dashed', fontcolor='#8A5300')

    g.node('servicios', 'Capa de Servicios', fillcolor=GREEN_FILL)
    g.edge('api', 'servicios')

    # Redis — corregido: cachea lecturas del panel admin (JPL/Guarda Cuencas),
    # no el catálogo de especies. Coherente con la tabla de Stack Tecnológico
    # (numeral 2.2) y con la Figura 1 del Documento Integral.
    g.node('redis', '⚡ Redis 7\nAJUSTE 2, caché de lecturas\ndel panel admin (JPL/GC),\nmenos de 5 ms vs. 60-120 ms',
           shape='box', fillcolor=BLUE_FILL)
    g.edge('servicios', 'redis', label='consulta', fontcolor='#8A5300')

    g.node('mongo', 'MongoDB Atlas\nBD Comunidad\nrespaldo bajo protocolo\npropio de TI Gobernación',
           shape='cylinder', fillcolor=GREEN_FILL)
    g.edge('redis', 'mongo', label='cache miss', fontcolor='#8A5300')

    return g


if __name__ == '__main__':
    import os
    out_dir = os.path.join(os.path.dirname(__file__), OUT_DIR)
    g = build()
    g.render(os.path.join(out_dir, OUT_NAME), cleanup=True)
    print('OK ->', os.path.join(out_dir, OUT_NAME + '.png'))
