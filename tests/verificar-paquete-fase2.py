"""Verificación mecánica del paquete estático, sin ejecutar módulos de producto."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import re
import subprocess
import zipfile

raiz = Path(__file__).resolve().parent.parent
lista = subprocess.run(
    ['node', '-e', "process.stdout.write(JSON.stringify(require('./scripts/preparar-netlify').PUBLICOS))"],
    cwd=raiz, check=True, capture_output=True, text=True
)
permitidos = json.loads(lista.stdout)
assert len(set(permitidos)) == len(permitidos), 'Lista pública duplicada'
assert 'index.html' in permitidos and 'js/johnson/caminos.js' in permitidos
assert 'js/comun/recientes-difusa.js' in permitidos
huellas = {nombre: hashlib.sha256((raiz / nombre).read_bytes()).digest() for nombre in permitidos}

for relativo in ('public', 'entrega-netlify/drop'):
    base = raiz / relativo
    reales = {p.relative_to(base).as_posix() for p in base.rglob('*') if p.is_file()}
    assert reales == set(permitidos), f'Inventario distinto: {relativo}'
    assert (base / 'index.html').is_file(), f'Falta index en raíz: {relativo}'
    for nombre in permitidos:
        assert hashlib.sha256((base / nombre).read_bytes()).digest() == huellas[nombre], f'Copia distinta: {relativo}/{nombre}'
    print(f'{relativo}: {len(reales)} archivos, copias SHA-256 idénticas a las fuentes seleccionadas')

archivo = raiz / 'entrega-netlify/ciudad-algoritmos-netlify.zip'
with zipfile.ZipFile(archivo) as paquete:
    nombres = paquete.namelist()
    assert len(nombres) == len(set(nombres)) and set(nombres) == set(permitidos), 'Contenido ZIP distinto'
    assert paquete.testzip() is None, 'CRC ZIP inválido'
    for nombre in nombres:
        ruta = PurePosixPath(nombre)
        assert not ruta.is_absolute() and '..' not in ruta.parts and '\\' not in nombre
        assert not any(parte.startswith('.') or parte.lower() in {'tests', 'node_modules', 'docs', 'logs', 'matlab'} for parte in ruta.parts)
        assert not re.search(r'gemini|obsoleto|backup|respaldo|\.zip$', nombre, re.I), 'Entrada ajena al sitio'
        contenido = paquete.read(nombre)
        assert hashlib.sha256(contenido).digest() == huellas[nombre], f'ZIP distinto: {nombre}'
        # Verificación genérica de artefacto: no imprime coincidencias ni interpreta
        # los algoritmos copiados, incluidos los expresamente excluidos del trabajo.
        assert not re.search(rb'AIza[0-9A-Za-z_-]{25,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----', contenido), f'Contenido sensible: {nombre}'
        assert not re.search(rb'gemini|/api/(?:asistente|estado)|\.netlify/functions', contenido, re.I), f'Dependencia remota: {nombre}'
    print(f'ZIP: {len(nombres)} entradas en raíz, CRC y SHA-256 correctos; solo archivos públicos autorizados')

print('Paquete preparado sin publicación. No contiene bibliotecas de ejercicios, pruebas, respaldos ni configuración local.')
