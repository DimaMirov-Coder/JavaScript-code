function shoot(player) {
    const angles = [0, 60, 120, 180, 240, 300]; // Углы поворота для каждого направления
    const speed = 1; // Скорость полета стрелы
    
    const playerDirection = player.getViewDirection();
    
    angles.forEach(angle => {
      const radian = angle * Math.PI / 180;
      const rotatedDirection = rotateVector(playerDirection, radian);
      
      const arrow = player.dimension.spawnEntity("minecraft:arrow", player.getHeadLocation());
      arrow.applyImpulse(Vector.multiply(rotatedDirection, speed));
      arrow.setOnFire(20, true);
      
      arrow.owner = player;
      arrow.damage = 5;
    });
}
  
  // Функция для поворота вектора на заданный угол
  function rotateVector(vector, angle) {
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    
    const x = vector.x * cosAngle - vector.z * sinAngle;
    const z = vector.x * sinAngle + vector.z * cosAngle;
    
    return new Vector(x, 0, z);
}
