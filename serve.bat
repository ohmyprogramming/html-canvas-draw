@echo off
start http://127.0.0.1:8040/index.html
@php -S 127.0.0.1:8040 -t "%cd%"
