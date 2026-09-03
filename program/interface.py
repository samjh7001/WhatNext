import numpy
import pydata
import pandas as pd
import PySimpleGUI as sg


df = pd.read_csv('gameData.csv')

sg.Window(title="Hello World", layout=[[]], margins=(100, 50)).read()