import React from "react";

interface BlockInfoProps {
    title: string;
    text: string;
    image: string;
    imagePosition: "left" | "right";
}

export const BlockInfo: React.FC<BlockInfoProps> = ({ title, text, image, imagePosition }) => {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px",
                backgroundColor: "#f9f9f9",
                borderRadius: "10px",
                boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                flexDirection: imagePosition === "left" ? "row" : "row-reverse",
            }}
        >
            <img
                src={image}
                alt="Описание"
                style={{

                    width: "800px",
                    borderRadius: "10px",
                    margin: "70px 200px",
                }}
            />

            <div
                style={{
                    flex: "1",
                    marginLeft: "100px",
                    marginRight: "100px",
                }}
            >
                <h2
                    style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        marginBottom: "10px",
                        color: "#333",
                    }}
                >
                    {title}
                </h2>
                <p
                    style={{
                        fontSize: "16px",
                        lineHeight: "1.5",
                        color: "#555",
                    }}
                >
                    {text}
                </p>
            </div>
        </div>
    );
};