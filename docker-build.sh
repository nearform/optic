#!/usr/bin/env bash

if [[ -f package-lock.json ]]; then
    PACKAGE_LOCK="yes"
fi

echo -e "\e[1mBuilding the static app...\e[0m"
npm run build
echo
echo


echo -e "\e[1mCreating the shrinkwrap...\e[0m"
npm shrinkwrap --dev
echo
echo


echo -e "\e[1mBuilding the container...\e[0m"
docker build -t nearform/optic .
echo
echo


if [[ ${PACKAGE_LOCK} == "yes" ]]; then
    mv npm-shrinkwrap.json package-lock.json
else
    rm npm-shrinkwrap.json
fi
