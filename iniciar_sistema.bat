@echo off
title Airbnb Control - Servidor Local
echo ========================================================
echo   Iniciando Airbnb Control - Servidor Local na porta 8080
echo ========================================================
echo.
echo Abrindo navegador em http://localhost:8080 ...
start http://localhost:8080
echo.
echo Servidor ativo! Mantenha esta janela aberta enquanto utilizar.
echo NOTA: O login oficial com Google requer http://localhost:8080 ou HTTPS (Vercel).
echo Para testar no celular, publique na Vercel ou utilize uma conexao HTTPS segura.
echo.
echo Pressione Ctrl+C ou feche esta janela para encerrar o servidor.
echo.
python -m http.server 8080
pause
