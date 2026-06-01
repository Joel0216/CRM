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
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `Usuario_ID` int(11) NOT NULL AUTO_INCREMENT,
  `Empresa_ID` int(11) NOT NULL,
  `Sucursal_ID` int(11) DEFAULT NULL,
  `Perfil_ID` int(11) NOT NULL,
  `Depto_ID` int(11) NOT NULL,
  `Nombre` varchar(100) NOT NULL,
  `Apellido_Paterno` varchar(100) NOT NULL,
  `Apellido_Materno` varchar(100) DEFAULT NULL,
  `Foto` varchar(255) DEFAULT NULL,
  `Correo` varchar(150) NOT NULL,
  `Username` varchar(50) NOT NULL,
  `Password_Hash` varchar(255) NOT NULL,
  `Password_Salt` varchar(255) NOT NULL,
  `Estatus` int(11) DEFAULT 1,
  `Primer_Login` tinyint(1) DEFAULT 0,
  `Cambio_Contrasena` tinyint(1) DEFAULT 0,
  `Idioma` char(5) DEFAULT 'es-MX',
  `Ultimo_Acceso` datetime DEFAULT NULL,
  `Fecha_Creacion` datetime DEFAULT current_timestamp(),
  `Fecha_Modificacion` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`Usuario_ID`),
  UNIQUE KEY `Correo` (`Correo`),
  UNIQUE KEY `Username` (`Username`),
  KEY `FK_Usuarios_Empresa` (`Empresa_ID`),
  KEY `FK_Usuarios_Sucursal` (`Sucursal_ID`),
  KEY `FK_Usuarios_Perfil` (`Perfil_ID`),
  KEY `FK_Usuarios_Departamento` (`Depto_ID`),
  CONSTRAINT `FK_Usuarios_Departamento` FOREIGN KEY (`Depto_ID`) REFERENCES `departamentos` (`Depto_ID`),
  CONSTRAINT `FK_Usuarios_Empresa` FOREIGN KEY (`Empresa_ID`) REFERENCES `empresas` (`Empresa_ID`),
  CONSTRAINT `FK_Usuarios_Perfil` FOREIGN KEY (`Perfil_ID`) REFERENCES `perfiles` (`Perfil_ID`),
  CONSTRAINT `FK_Usuarios_Sucursal` FOREIGN KEY (`Sucursal_ID`) REFERENCES `sucursales` (`Sucursal_ID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,1,1,1,1,'Carlos','López','Méndez',NULL,'carlos.lopez@ecosales.com','carlos.lopez','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','salt123',1,1,0,'es-MX',NULL,'2026-05-28 11:11:16','2026-05-28 11:11:16'),(2,1,1,2,1,'Ana','García','Hernández',NULL,'ana.garcia@ecosales.com','ana.garcia','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','salt123',1,0,0,'es-MX',NULL,'2026-05-28 11:11:16','2026-05-28 11:11:16'),(3,2,2,2,2,'Roberto','Martínez','Sánchez',NULL,'roberto.martinez@greentech.com','roberto.mtz','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','salt123',1,0,0,'es-MX',NULL,'2026-05-28 11:11:16','2026-05-28 11:11:16');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-29 12:29:28
