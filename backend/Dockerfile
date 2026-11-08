# ==============================================================================
# Stage 1: Build Spring Boot Application với Maven
# ==============================================================================
FROM maven:3.9.8-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Copy pom.xml và tải trước các dependency để tận dụng cache của Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy toàn bộ mã nguồn backend và tiến hành đóng gói (bỏ qua test khi đóng gói image)
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================================
# Stage 2: Chạy ứng dụng với JRE 17 nhẹ gọn
# ==============================================================================
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Chạy bằng user thường (không dùng root) cho an toàn khi deploy Staging/Production
RUN addgroup -S spring && adduser -S spring -G spring

# Copy file jar đã build từ Stage 1
COPY --from=builder --chown=spring:spring /app/target/*.jar app.jar

USER spring

# Tinh chỉnh JVM cho container RAM thấp (Render free = 512MB):
# - MaxRAMPercentage: heap tối đa theo % RAM container thay vì giá trị cố định
# - UseSerialGC: tốn ít bộ nhớ nhất, phù hợp 1 vCPU
# Có thể ghi đè bằng biến môi trường JAVA_OPTS trên Render/Railway
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseSerialGC -Xss512k -XX:+ExitOnOutOfMemoryError"

# Mở cổng 8080 của backend (Render/Railway truyền cổng thật qua biến PORT, xem server.port trong application.yml)
EXPOSE 8080

# Chạy ứng dụng (dùng sh -c để mở rộng biến JAVA_OPTS, exec để java nhận tín hiệu dừng SIGTERM)
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
