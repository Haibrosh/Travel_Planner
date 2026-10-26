package com.travel.planner.controller;

import com.travel.planner.dto.ChatMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
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
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WebSocketIntegrationTest {

    @LocalServerPort
    private int port;

    private static WebSocketStompClient stompClient;

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

        StompSession session = stompClient.connect(url, new WebSocketHttpHeaders(), handler).get(5, TimeUnit.SECONDS);
        ChatMessage received = future.get(5, TimeUnit.SECONDS);
        assertNotNull(received);
        assertEquals("tester", received.getSender());
        assertEquals("hello", received.getContent());
        session.disconnect();
    }
}
