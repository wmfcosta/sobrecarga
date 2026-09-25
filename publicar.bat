@echo off
rem Publica a atualizacao do Sobrecarga preparada pelo Claude (atualizacao.patch)
cd /d "%~dp0"
del combo-grafico.bat combo-grafico.log >nul 2>&1
set LOG=publicar.log
echo ==== Sobrecarga: publicar atualizacao ==== > %LOG%
if not exist atualizacao.patch (
  echo RESULTADO: NENHUMA_ATUALIZACAO >> %LOG%
  goto fim
)
git pull --ff-only origin main >> %LOG% 2>&1
git am -3 atualizacao.patch >> %LOG% 2>&1
if errorlevel 1 (
  git am --abort >> %LOG% 2>&1
  echo RESULTADO: FALHA_AO_APLICAR >> %LOG%
  goto fim
)
git push origin main >> %LOG% 2>&1
if errorlevel 1 (
  echo RESULTADO: FALHA_NO_PUSH >> %LOG%
  goto fim
)
del atualizacao.patch >nul 2>&1
git log --oneline -1 >> %LOG% 2>&1
echo RESULTADO: OK >> %LOG%
:fim
type %LOG%
timeout /t 8 >nul
