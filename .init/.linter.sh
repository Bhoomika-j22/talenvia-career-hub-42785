#!/bin/bash
cd /home/kavia/workspace/code-generation/talenvia-career-hub-42785/talenvia_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

