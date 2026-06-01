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
-- Table structure for table `crm_tareas_seguimiento`
--

DROP TABLE IF EXISTS `crm_tareas_seguimiento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crm_tareas_seguimiento` (
  `Tarea_ID` int(11) NOT NULL AUTO_INCREMENT,
  `Usuario_ID` int(11) NOT NULL,
  `Prospecto_ID` int(11) DEFAULT NULL,
  `Trato_ID` int(11) DEFAULT NULL,
  `Asunto` varchar(255) NOT NULL,
  `Fecha_Vencimiento` date NOT NULL,
  `Prioridad` enum('Lowest','Low','Normal','High','Highest') DEFAULT 'Normal',
  `Estado` enum('Not Started','In Progress','Completed','Deferred') DEFAULT 'Not Started',
  `Notas_Falta_Contacto` text DEFAULT NULL,
  `Fecha_Creacion` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`Tarea_ID`),
  KEY `KEY_CRM_Tareas_Usuario` (`Usuario_ID`),
  KEY `KEY_CRM_Tareas_Prospecto` (`Prospecto_ID`),
  KEY `KEY_CRM_Tareas_Trato` (`Trato_ID`),
  CONSTRAINT `FK_CRM_Tareas_Prospecto` FOREIGN KEY (`Prospecto_ID`) REFERENCES `crm_prospectos` (`Prospecto_ID`) ON DELETE CASCADE,
  CONSTRAINT `FK_CRM_Tareas_Trato` FOREIGN KEY (`Trato_ID`) REFERENCES `crm_tratos` (`Trato_ID`) ON DELETE CASCADE,
  CONSTRAINT `FK_CRM_Tareas_Usuario` FOREIGN KEY (`Usuario_ID`) REFERENCES `usuarios` (`Usuario_ID`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crm_tareas_seguimiento`
--

LOCK TABLES `crm_tareas_seguimiento` WRITE;
/*!40000 ALTER TABLE `crm_tareas_seguimiento` DISABLE KEYS */;
/*!40000 ALTER TABLE `crm_tareas_seguimiento` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-29 12:29:25
