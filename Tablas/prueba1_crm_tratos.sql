-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: prueba1
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `crm_tratos`
--

DROP TABLE IF EXISTS `crm_tratos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_tratos` (
  `Trato_ID` int(11) NOT NULL AUTO_INCREMENT,
  `Prospecto_ID` int(11) DEFAULT NULL,
  `Cliente_ID` int(11) DEFAULT NULL,
  `Propietario_ID` int(11) NOT NULL,
  `Nombre_Trato` varchar(150) NOT NULL,
  `Importe` decimal(12,2) NOT NULL DEFAULT 0.00,
  `Fase_ID` int(11) NOT NULL,
  `Fecha_Cierre_Estimada` date NOT NULL,
  `Promesa_Pago_Cobranza` tinyint(1) DEFAULT 0,
  `Fecha_Creacion` datetime DEFAULT current_timestamp(),
  `Fecha_Modificacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`Trato_ID`),
  KEY `KEY_CRM_Tratos_Prospecto` (`Prospecto_ID`),
  KEY `KEY_CRM_Tratos_Cliente` (`Cliente_ID`),
  KEY `KEY_CRM_Tratos_Usuario` (`Propietario_ID`),
  KEY `KEY_CRM_Tratos_Fase` (`Fase_ID`),
  CONSTRAINT `FK_CRM_Tratos_Cliente` FOREIGN KEY (`Cliente_ID`) REFERENCES `clientes` (`Cliente_ID`) ON DELETE SET NULL,
  CONSTRAINT `FK_CRM_Tratos_Fase` FOREIGN KEY (`Fase_ID`) REFERENCES `crm_fases_trato` (`Fase_ID`) ON UPDATE CASCADE,
  CONSTRAINT `FK_CRM_Tratos_Prospecto` FOREIGN KEY (`Prospecto_ID`) REFERENCES `crm_prospectos` (`Prospecto_ID`) ON DELETE SET NULL,
  CONSTRAINT `FK_CRM_Tratos_Usuario` FOREIGN KEY (`Propietario_ID`) REFERENCES `usuarios` (`Usuario_ID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_tratos`
--

LOCK TABLES `crm_tratos` WRITE;
/*!40000 ALTER TABLE `crm_tratos` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_tratos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-29 12:29:26
