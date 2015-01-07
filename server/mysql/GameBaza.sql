CREATE TABLE IF NOT EXISTS `person` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(30) NOT NULL COMMENT 'Username',
  `password` varchar(35) NOT NULL COMMENT 'MD5 password hash',
  `mail` varchar(40) NOT NULL COMMENT 'E-mail',
  `total` int(11) NOT NULL COMMENT 'Number of games played',
  `victories` int(11) NOT NULL COMMENT 'Number of games won',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;

CREATE TABLE IF NOT EXISTS `roomHistory` (
  `personID` int(11) NOT NULL COMMENT 'Player',
  `roomID` int(11) NOT NULL COMMENT 'Room',
  `time` float NOT NULL COMMENT 'Total time spent answering',
  `answers` int(11) NOT NULL COMMENT 'Total number of answers',
  KEY `roomID` (`roomID`),
  KEY `personID` (`personID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `room` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL COMMENT 'Room name',
  `finished` datetime NOT NULL COMMENT 'Time game finished',
  `winnerID` int(11) NOT NULL COMMENT 'Winner',
  PRIMARY KEY (`id`),
  KEY `winnerID` (`winnerID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

ALTER TABLE `roomHistory`
  ADD CONSTRAINT `roomHistory_room` FOREIGN KEY (`roomID`) REFERENCES `room` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `roomHistory_person` FOREIGN KEY (`personID`) REFERENCES `person` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `room`
  ADD CONSTRAINT `room_person` FOREIGN KEY (`winnerID`) REFERENCES `person` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;