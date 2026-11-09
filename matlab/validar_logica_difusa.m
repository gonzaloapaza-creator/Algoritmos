% VALIDAR_LOGICA_DIFUSA Comparacion del ejemplo original con politica continua.
% Pendiente de ejecucion real: no se ha ejecutado ni instalado MATLAB aqui.
% Requiere MATLAB R2018b+ y Fuzzy Logic Toolbox con licencia.
%
% 1. Desde la raiz: node scripts/exportar-referencias-difusa.js
% 2. En MATLAB:    run('matlab/validar_logica_difusa.m')
%
% El exportador genera referencias originales v1 y el modelo completo v2.
% Este acceso usa v2 para contrastar la integral continua con una cuadratura
% adaptativa independiente. evalfis de 1001 muestras queda como aproximacion
% auxiliar, sin exigir igualdad con la integral ni ampliar tolerancias.
% No guarda capturas ni archivos graficos.
carpetaScript = fileparts(mfilename('fullpath'));
addpath(carpetaScript);
validar_sistema_difuso(fullfile(carpetaScript, 'referencias_sistema_difuso.json'));
