package com.travel.planner.controller;

import com.travel.planner.dto.ChatMessage;
import com.travel.planner.model.User;
import com.travel.planner.repository.UserRepository;
import com.travel.planner.security.CustomUserDetails;
import com.travel.planner.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private static WebSocketStompClient stompClient;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        User user = userRepository.findAll().stream().findFirst().orElseGet(() -> userRepository.save(
                User.builder()
                        .email("websocket_test@sightseeker.com")
                        .username("WebSocket Test")
                        .password("$2a$10$abcdefghijk1234567890abcdefghijk1234567890abcdefghijk")
                        .build()
        ));
        jwtToken = jwtService.generateToken(new CustomUserDetails(user));
    }

    @BeforeAll
    static void setupAll() {
        // Use native WebSocket (SockJS fallback not needed for test)
        List<Transport> transports = Collections.singletonList(new WebSocketTransport(new StandardWebSocketClient()));
        SockJsClient sockJsClient = new SockJsClient(transports);
        stompClient = new WebSocketStompClient(sockJsClient);
        stompClient.setMessageConverter(new MappingJackson2MessageConverter());
    }

    @AfterAll
    static void tearDownAll() {
        if (stompClient != null) {
            stompClient.stop();
        }
    }

    @Test
    void testChatMessageBroadcast() throws Exception {
        String url = String.format("ws://localhost:%d/ws", port);
        CompletableFuture<ChatMessage> future = new CompletableFuture<>();

        StompSessionHandlerAdapter handler = new StompSessionHandlerAdapter() {
            @Override
            public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
                session.subscribe("/topic/public", new StompSessionHandlerAdapter() {
                    @Override
                    public Type getPayloadType(StompHeaders headers) {
                        return ChatMessage.class;
                    }
                    @Override
                    public void handleFrame(StompHeaders headers, Object payload) {
                        future.complete((ChatMessage) payload);
                    }
                });
                // send a test message
                ChatMessage msg = new ChatMessage("tester", "hello", null);
                session.send("/app/chat.sendMessage", msg);
            }
        };

        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.add("Authorization", "Bearer " + jwtToken);
        StompSession session = stompClient.connect(
                url, new WebSocketHttpHeaders(), connectHeaders, handler
        ).get(5, TimeUnit.SECONDS);
        ChatMessage received = future.get(5, TimeUnit.SECONDS);
        assertNotNull(received);
        assertEquals("tester", received.getSender());
        assertEquals("hello", received.getContent());
        session.disconnect();
    }

    @Test
    void testAnonymousConnectionIsRejected() {
        String url = String.format("ws://localhost:%d/ws", port);
        StompSessionHandlerAdapter handler = new StompSessionHandlerAdapter() {};

        assertThrows(ExecutionException.class, () ->
                stompClient.connect(url, new WebSocketHttpHeaders(), handler)
                        .get(5, TimeUnit.SECONDS)
        );
    }
}
