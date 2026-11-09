function validar_sistema_difuso(rutaJSON)
% VALIDAR_SISTEMA_DIFUSO Contrasta un JSON de comparacion del editor Mamdani.
% Requiere MATLAB R2018b+ y Fuzzy Logic Toolbox. No se ha ejecutado MATLAB
% en el entorno de entrega: la comparacion sigue pendiente hasta ejecutarla.
%
% Desde MATLAB, con la carpeta del proyecto como directorio actual:
%   addpath('matlab');
%   validar_sistema_difuso('referencias_sistema_difuso.json');
%
% Descargar ese JSON desde "Comparacion numerica" del modulo. El JSON de
% trabajo tiene otra finalidad y no se acepta aqui. No importa archivos .fis.
% No guarda imagenes ni modifica el JSON. Solo dibuja funciones en figuras.
%
% AND=min, OR=max; antecedente*peso; implicacion=min; agregacion=max;
% centroide continuo. La referencia independiente usa integral adaptativa con
% nudos y recortes como Waypoints. evalfis de 1001 puntos se muestra aparte;
% no se exige que esa aproximacion discreta coincida con la integral.
% Fuentes oficiales de la sintaxis y convenciones numericas:
% https://www.mathworks.com/help/fuzzy/mamfis.html
% https://www.mathworks.com/help/fuzzy/mamfis.addinput.html
% https://www.mathworks.com/help/fuzzy/mamfis.addoutput.html
% https://www.mathworks.com/help/fuzzy/mamfis.addmf.html
% https://www.mathworks.com/help/fuzzy/mamfis.addrule.html
% https://www.mathworks.com/help/fuzzy/mamfis.evalfis.html
% https://www.mathworks.com/help/fuzzy/fuzzy.evalfis.evalfisoptions.html
% https://www.mathworks.com/help/fuzzy/defuzzification-methods.html

assert(nargin == 1 && (ischar(rutaJSON) || isstring(rutaJSON)), ...
    'Indica la ruta del JSON de comparacion numerica exportado desde el modulo.');
assert(~verLessThan('matlab', '9.5'), 'Se requiere MATLAB R2018b o posterior.');
infoFuzzy = ver('fuzzy');
assert(~isempty(infoFuzzy) && license('test', 'Fuzzy_Toolbox'), ...
    'Se requiere Fuzzy Logic Toolbox instalada y con licencia disponible.');
assert(isfile(rutaJSON), 'No se encontro el JSON indicado.');
datos = jsondecode(fileread(rutaJSON));
assert(isstruct(datos) && isscalar(datos) && ...
    all(isfield(datos, {'tipo', 'version', 'modelo', 'muestreo', 'casos', 'reglasNumericas'})) && ...
    strcmp(datos.tipo, 'ciudad-logica-difusa-comparacion') && isequal(datos.version, 2), ...
    'Se requiere un JSON de comparacion numerica version 2, no un JSON de trabajo.');
modelo = datos.modelo;
assert(isstruct(modelo) && isscalar(modelo) && all(isfield(modelo, {'entradas', 'salida', 'reglas'})), ...
    'El JSON debe incluir el modelo configurado.');
numEntradas = numel(modelo.entradas);
assert(isstruct(modelo.entradas) && numEntradas >= 1 && numEntradas <= 3, ...
    'Se admiten de una a tres entradas.');
assert(isstruct(modelo.reglas) && numel(modelo.reglas) >= 1 && numel(modelo.reglas) <= 125, ...
    'El modelo debe contener de una a 125 reglas.');

fis = mamfis('Name', 'SistemaDifusoExportado', 'AndMethod', 'min', ...
    'OrMethod', 'max', 'ImplicationMethod', 'min', ...
    'AggregationMethod', 'max', 'DefuzzificationMethod', 'centroid');
for i = 1:numEntradas
    variable = modelo.entradas(i);
    validarVariable(variable);
    nombreInterno = ['entrada' num2str(i)];
    fis = addInput(fis, [variable.min variable.max], 'Name', nombreInterno);
    fis = agregarConjuntos(fis, nombreInterno, variable.conjuntos);
end
validarVariable(modelo.salida);
fis = addOutput(fis, [modelo.salida.min modelo.salida.max], 'Name', 'salida');
fis = agregarConjuntos(fis, 'salida', modelo.salida.conjuntos);

% Matriz de indices creada por el exportador JS, en el orden de las variables
% y conjuntos del modelo. Evita colisiones de IDs como "a-b"/"a_b" al leer
% objetos JSON, porque jsondecode normaliza esos nombres de propiedades.
% Incluye solo reglas habilitadas, completas y con peso mayor que cero.
% Columnas: antecedentes (0=No importa), consecuente, peso, conexion (1/2).
reglas = datos.reglasNumericas;
assert(isnumeric(reglas) && isreal(reglas) && all(isfinite(reglas(:))), ...
    'La matriz reglasNumericas debe ser numerica y finita.');
if isempty(reglas)
    reglas = zeros(0, numEntradas + 3);
end
assert(size(reglas, 2) == numEntradas + 3 && size(reglas, 1) <= 125, ...
    'Dimensiones incorrectas en reglasNumericas.');
for i = 1:size(reglas, 1)
    fila = reglas(i, :);
    for j = 1:numEntradas
        assert(fila(j) == fix(fila(j)) && fila(j) >= 0 && ...
            fila(j) <= numel(modelo.entradas(j).conjuntos), 'Indice de antecedente invalido.');
    end
    assert(any(fila(1:numEntradas) > 0), 'Cada regla debe utilizar alguna entrada.');
    assert(fila(numEntradas + 1) == fix(fila(numEntradas + 1)) && ...
        fila(numEntradas + 1) >= 1 && fila(numEntradas + 1) <= numel(modelo.salida.conjuntos), ...
        'Indice de consecuente invalido.');
    assert(fila(numEntradas + 2) > 0 && fila(numEntradas + 2) <= 1, 'Peso invalido.');
    assert(ismember(fila(numEntradas + 3), [1 2]), 'Conexion invalida: 1=AND, 2=OR.');
end
if ~isempty(reglas), fis = addRule(fis, reglas); end

numPuntos = 1001;
assert(isfield(datos, 'integracion') && ...
    strcmp(datos.integracion.metodo, 'continua-por-tramos-lineales'), ...
    'Regenera/exporta el JSON: este script contrasta la politica continua.');
assert(isstruct(datos.muestreo) && all(isfield(datos.muestreo, {'puntos', 'minimo', 'maximo'})) && ...
    isequal(datos.muestreo.puntos, numPuntos) && ...
    isequal(datos.muestreo.minimo, modelo.salida.min) && ...
    isequal(datos.muestreo.maximo, modelo.salida.max), 'La malla debe coincidir con el dominio y tener 1001 puntos.');
opciones = evalfisOptions('NumSamplePoints', numPuntos);
opciones.OutOfRangeInputValueMessage = 'error';
% evalfis es una aproximacion discreta auxiliar, nunca una prueba de igualdad
% con la integral ni una autoridad ante una salida muestreada vacia.
opciones.NoRuleFiredMessage = 'none';
opciones.EmptyOutputFuzzySetMessage = 'none';
tolerancia = 1e-8;
% Tolerancia absoluta propuesta para contrastar las integrales. Comparacion
% pendiente hasta ejecutar este script; no se amplia para ocultar errores.
assert(isstruct(datos.casos) && ~isempty(datos.casos) && ...
    all(isfield(datos.casos, {'valores', 'resultado'})), 'No hay casos de comparacion validos.');
numCasos = numel(datos.casos);
entradasTabla = cell(numCasos, 1); jsTabla = cell(numCasos, 1);
matlabTabla = cell(numCasos, 1); errorTabla = cell(numCasos, 1); discretaTabla = cell(numCasos, 1);
errorMaximo = 0;
for i = 1:numCasos
    caso = datos.casos(i);
    validateattributes(caso.valores, {'numeric'}, {'real', 'finite', 'vector', 'numel', numEntradas});
    valores = caso.valores(:)';
    for j = 1:numEntradas
        assert(valores(j) >= modelo.entradas(j).min && valores(j) <= modelo.entradas(j).max, ...
            'Hay una entrada fuera de su dominio.');
    end
    entradasTabla{i} = mat2str(valores, 15);
    [valorContinuo, denominador] = centroideIndependiente(modelo, reglas, valores);
    if denominador == 0
        assert(isempty(caso.resultado), 'La web debe exportar null cuando la masa agregada es cero.');
        jsTabla{i} = 'Sin masa'; matlabTabla{i} = 'Sin masa'; errorTabla{i} = 'Estado coincidente'; discretaTabla{i} = 'No se compara';
    else
        validateattributes(caso.resultado, {'numeric'}, {'real', 'finite', 'scalar'});
        diferencia = abs(valorContinuo - caso.resultado);
        assert(diferencia <= tolerancia, ...
            sprintf('Caso %d: discrepancia continua %.12g, tolerancia %.12g.', i, diferencia, tolerancia));
        errorMaximo = max(errorMaximo, diferencia);
        jsTabla{i} = num2str(caso.resultado, 15); matlabTabla{i} = num2str(valorContinuo, 15); errorTabla{i} = num2str(diferencia, 12);
        discretaTabla{i} = num2str(evalfis(fis, valores, opciones), 15);
    end
end
disp(table(entradasTabla, jsTabla, matlabTabla, errorTabla, discretaTabla, ...
    'VariableNames', {'Entradas', 'JavaScriptContinuo', 'IntegralMATLAB', 'ErrorAbsoluto', 'EvalfisDiscretoAuxiliar'}));
fprintf('Comparacion continua ejecutada: %d casos, error maximo %.12g, tolerancia %.12g.\n', numCasos, errorMaximo, tolerancia);
fprintf('MATLAB %s; Fuzzy Logic Toolbox %s.\n', version('-release'), infoFuzzy.Version);

figure('Name', 'Sistema Mamdani exportado: pertenencias');
for i = 1:numEntradas
    subplot(numEntradas + 1, 1, i);
    plotmf(fis, 'input', i);
    title(modelo.entradas(i).nombre, 'Interpreter', 'none');
    xlabel(etiquetaVariable(modelo.entradas(i)), 'Interpreter', 'none'); ylabel('Pertenencia'); grid on;
    legend({modelo.entradas(i).conjuntos.nombre}, 'Interpreter', 'none', 'Location', 'best');
end
subplot(numEntradas + 1, 1, numEntradas + 1);
plotmf(fis, 'output', 1);
title(modelo.salida.nombre, 'Interpreter', 'none');
xlabel(etiquetaVariable(modelo.salida), 'Interpreter', 'none'); ylabel('Pertenencia'); grid on;
legend({modelo.salida.conjuntos.nombre}, 'Interpreter', 'none', 'Location', 'best');
end

function validarVariable(variable)
assert(isstruct(variable) && isscalar(variable) && all(isfield(variable, {'nombre', 'min', 'max', 'conjuntos'})), 'Variable incompleta.');
validateattributes(variable.min, {'numeric'}, {'real', 'finite', 'scalar', '>=', -1000000, '<=', 1000000});
validateattributes(variable.max, {'numeric'}, {'real', 'finite', 'scalar', '>=', -1000000, '<=', 1000000});
assert(variable.min < variable.max && numel(variable.conjuntos) >= 2 && numel(variable.conjuntos) <= 5, 'Dominio o cantidad de conjuntos invalida.');
for i = 1:numel(variable.conjuntos)
    c = variable.conjuntos(i);
    assert(all(isfield(c, {'tipo', 'parametros'})), 'Conjunto incompleto.');
    assert(strcmp(c.tipo, 'triangular') || strcmp(c.tipo, 'trapezoidal'), 'Tipo de conjunto no soportado.');
    cantidad = 3 + strcmp(c.tipo, 'trapezoidal');
    validateattributes(c.parametros, {'numeric'}, {'real', 'finite', 'vector', 'numel', cantidad});
    p = c.parametros(:)';
    assert(all(diff(p) >= 0) && p(1) < p(end) && all(p >= variable.min & p <= variable.max), 'Parametros sin orden, soporte o dominio valido.');
end
end

function [valor, area] = centroideIndependiente(modelo, reglas, valores)
% Referencia distinta del integrador analitico JS: cuadratura adaptativa de
% funciones de MathWorks con nudos/recortes explicitos. No ha sido ejecutada
% en este entorno. Incluso un soporte estrecho se separa mediante Waypoints.
n = numel(modelo.entradas);
alturas = zeros(1, numel(modelo.salida.conjuntos));
for i = 1:size(reglas, 1)
    grados = [];
    for j = 1:n
        indice = reglas(i, j);
        if indice > 0
            grados(end + 1) = pertenenciaIndependiente(valores(j), modelo.entradas(j).conjuntos(indice)); %#ok<AGROW>
        end
    end
    if reglas(i, n + 3) == 1, activacion = min(grados); else, activacion = max(grados); end
    indiceSalida = reglas(i, n + 1);
    alturas(indiceSalida) = max(alturas(indiceSalida), activacion * reglas(i, n + 2));
end
salida = modelo.salida;
nudos = [salida.min salida.max];
for i = 1:numel(salida.conjuntos)
    if alturas(i) <= 0, continue; end
    p = salida.conjuntos(i).parametros(:)';
    if strcmp(salida.conjuntos(i).tipo, 'triangular'), p = [p(1) p(2) p(2) p(3)]; end
    nudos = [nudos p p(1) + alturas(i) * (p(2) - p(1)) p(4) - alturas(i) * (p(4) - p(3))]; %#ok<AGROW>
end
nudos = unique(nudos);
if ~any(alturas > 0), valor = []; area = 0; return; end
mu = @(y) agregadaIndependiente(y, salida.conjuntos, alturas);
area = 0; momento = 0;
% Integrar cada intervalo por separado evita que el algoritmo adaptativo
% omita soportes estrechos al distribuir su presupuesto sobre todo el rango.
for i = 1:numel(nudos) - 1
    if nudos(i + 1) <= nudos(i), continue; end
    area = area + integral(mu, nudos(i), nudos(i + 1), 'AbsTol', 0, 'RelTol', 1e-11);
    momento = momento + integral(@(y) y .* mu(y), nudos(i), nudos(i + 1), 'AbsTol', 0, 'RelTol', 1e-11);
end
if area == 0, valor = []; else, valor = momento / area; end
end

function grados = pertenenciaIndependiente(y, conjunto)
if strcmp(conjunto.tipo, 'triangular'), grados = trimf(y, conjunto.parametros(:)');
else, grados = trapmf(y, conjunto.parametros(:)'); end
end

function mu = agregadaIndependiente(y, conjuntos, alturas)
mu = zeros(size(y));
for i = 1:numel(conjuntos)
    if alturas(i) > 0, mu = max(mu, min(alturas(i), pertenenciaIndependiente(y, conjuntos(i)))); end
end
end

function fis = agregarConjuntos(fis, nombre, conjuntos)
for i = 1:numel(conjuntos)
    c = conjuntos(i);
    if strcmp(c.tipo, 'triangular'), tipo = 'trimf'; else, tipo = 'trapmf'; end
    fis = addMF(fis, nombre, tipo, c.parametros(:)', 'Name', ['conjunto' num2str(i)]);
end
end

function etiqueta = etiquetaVariable(variable)
etiqueta = variable.nombre;
if isfield(variable, 'unidad') && ~isempty(variable.unidad), etiqueta = [etiqueta ' (' variable.unidad ')']; end
end
