"""
generate_figura3_infraestructura.py
Genera el diagrama de Infraestructura (Figura 3 del Documento Integral de
Desarrollo) con graphviz. Reemplaza "PM2 → Node.js 22 backend Express" por
el despliegue real vía Docker Compose (ver Dockerfile/docker-compose.yml,
2026-08-06), y actualiza la etiqueta del pipeline de CI/CD para reflejar la
stage BuildImage (build + escaneo Trivy) que ya existe en azure-pipelines.yml.

No existía un script fuente versionado para este diagrama antes de esto
(era un PNG suelto, igual que la Figura 1 antes de corregirla) — este
script es ahora la fuente de verdad.

Requiere: pip install graphviz + brew install graphviz (binario `dot`).

Uso: python3 src/scripts/generate_figura3_infraestructura.py
"""
import os
import graphviz

GREEN = '#4B8039'
GREEN_FILL = '#E8F5E9'
BLUE_FILL = '#E3F2FD'
AMBER_FILL = '#FFF3E0'
NODE_FILL = '#FFFFFF'

OUT_DIR = '../../../Documentos gobernacion/TI/REVISION 2/diagramas'
OUT_NAME = 'infraestructura'


def build():
    g = graphviz.Digraph('figura3', format='png')
    g.attr(rankdir='TB', splines='spline', bgcolor='white', fontname='Helvetica',
           margin='0.15', nodesep='0.5', ranksep='0.5')
    g.attr('node', fontname='Helvetica', fontsize='11', shape='box', style='filled',
           color=GREEN, fillcolor=NODE_FILL, margin='0.15,0.1')
    g.attr('edge', color=GREEN, fontname='Helvetica', fontsize='10')

    g.node('dev', 'Desarrollo\nlocalhost:3000\nbackend/.env', fillcolor='#F5F5F5', color='#888888')
    g.node('repos', 'Azure Repos (institucional)\nespejo del repositorio de desarrollo')
    g.edge('dev', 'repos', label='push', fontcolor='#8A5300')

    # ── QA / Staging (rama develop) ──
    with g.subgraph(name='cluster_qa') as qa:
        qa.attr(label='QA / Staging, rama develop', fontname='Helvetica-Bold', fontsize='11',
                color='#B8860B', style='filled', fillcolor=AMBER_FILL, margin='16')
        qa.node('qa_env', 'Entorno interno del equipo\nde desarrollo\nlocalhost:3001,\nbackend/.env.qa')
        qa.node('qa_mongo', 'MongoDB Atlas\nantioquia-biodiversa-qa', shape='cylinder')
        qa.edge('qa_env', 'qa_mongo')

    g.edge('repos', 'qa_env', label='valida antes de\nfusionar a main', fontcolor='#8A5300')

    # ── Pipeline ──
    g.node('pipeline', 'Azure DevOps Pipeline\nCI: audit · lint:security · test · semgrep\nBuildImage: docker build + Trivy\nCD: docker compose deploy')
    g.edge('repos', 'pipeline')

    # ── Producción (rama main) ──
    with g.subgraph(name='cluster_prod') as prod:
        prod.attr(label='Producción, rama main', fontname='Helvetica-Bold', fontsize='11',
                  color=GREEN, style='filled', fillcolor=GREEN_FILL, margin='16')

        with prod.subgraph(name='cluster_server') as srv:
            srv.attr(label='Servidor Gobernación, Ubuntu 24.04 LTS', fontname='Helvetica-Bold',
                     fontsize='10', color=GREEN, style='filled', fillcolor=BLUE_FILL, margin='12')
            srv.node('nginx', 'Nginx\nsirve frontend estático +\nproxy inverso/SSL (Certbot)')
            srv.node('docker', 'Docker Compose\ncontenedor Node.js 22 + Express\n(imagen desde el registry)')
            srv.edge('nginx', 'docker')

        prod.node('redis', 'Redis 7\ncaché', shape='cylinder', fillcolor=GREEN_FILL)
        prod.node('prod_mongo', 'MongoDB Atlas\nBD Comunidad, producción', shape='cylinder', fillcolor=GREEN_FILL)
        prod.edge('docker', 'redis')
        prod.edge('docker', 'prod_mongo')

    g.edge('pipeline', 'nginx', label='deploy con\naprobación manual', fontcolor='#8A5300')

    return g


if __name__ == '__main__':
    out_dir = os.path.join(os.path.dirname(__file__), OUT_DIR)
    g = build()
    g.render(os.path.join(out_dir, OUT_NAME), cleanup=True)
    print('OK ->', os.path.join(out_dir, OUT_NAME + '.png'))
