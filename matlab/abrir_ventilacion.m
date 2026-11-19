function abrir_ventilacion
% ABRIR_VENTILACION Abre el FIS original junto a este archivo.
% La funcion mantiene sus variables locales y no cambia la carpeta actual.
carpetaEjemplo = fileparts(mfilename('fullpath'));
archivoFIS = fullfile(carpetaEjemplo, 'ventilacion_aula.fis');

if ~isfile(archivoFIS)
    fprintf(2, ['No se encontro ventilacion_aula.fis junto a abrir_ventilacion.m.\n' ...
        'Extrae el paquete y sube sus archivos a una misma carpeta.\nRuta esperada: %s\n'], archivoFIS);
    return;
end

if isempty(which('fuzzyLogicDesigner'))
    fprintf(2, ['Fuzzy Logic Designer no esta disponible.\n' ...
        'Comprueba que tu cuenta tenga acceso a MATLAB y Fuzzy Logic Toolbox.\n']);
    return;
end

try
    fuzzyLogicDesigner(archivoFIS);
catch problemaApertura
    fprintf(2, ['No se pudo abrir el modelo en Fuzzy Logic Designer.\n' ...
        'Comprueba el acceso a Fuzzy Logic Toolbox y que el archivo .fis este completo.\n' ...
        'Detalle de MATLAB: %s\n'], problemaApertura.message);
end
end
