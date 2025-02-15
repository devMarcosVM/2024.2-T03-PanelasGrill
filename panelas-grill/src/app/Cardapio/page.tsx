"use client";
import Sidebar from "@/components/Sidebar";
import { Search,Trash,Pencil,X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    consultarEstoque,
    consultarCardapio,
    criarCardapio,
    editarCardapio,
    prepararCardapio,
    excluirCardapio, // Importe a função de exclusão de cardápio
} from "@/services/mongoService";
import "./cardapio.css";

interface NovoItem {
    _id?: string;
    item: string;
    tipo: string;
    quantidade: number;
    referencia_quantidade: string;
}

interface IngredienteModel {
    item_estoque_id: string;
    quantidade: number;
    referencia_quantidade: string;
}

interface NovoCardapio {
    _id?: string;
    nome: string;
    ingredientes: IngredienteModel[];
}

export default function Menu() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [showInput, setShowInput] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [cardapios, setCardapios] = useState<NovoCardapio[]>([]); // Tipagem correta
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [tempCardapio, settempCardapio] = useState<NovoCardapio | null>(null);
    const [editCardapioData, setEditCardapioData] = useState<NovoCardapio | null>(null); //Tipagem Correta
    const [estoque, setEstoque] = useState<NovoItem[]>([]);

    const [novoCardapio, setNovoCardapio] = useState<NovoCardapio>({
        nome: "",
        ingredientes: [],
    });

    const removerIngrediente_edit = (index: number) => {
        if (isEditing && editCardapioData) {
            const novosIngredientes = [...editCardapioData.ingredientes];
            novosIngredientes.splice(index, 1); // Remove o ingrediente na posição index
            setEditCardapioData({ ...editCardapioData, ingredientes: novosIngredientes });
        }
    };

    const carregarCardapios = async () => {
        try {
            const data = await consultarCardapio();
            if (data.status === "success") {
                setCardapios(data.data);
            } else {
                alert(`Erro ao carregar cardápios: ${data.message}`);
            }
        } catch (error) {
            console.error("Erro ao carregar cardápios:", error);
            alert("Erro ao carregar cardápios. Verifique o console.");
        }
    };

    const removerIngrediente = (index: number) => {
        const novosIngredientes = [...novoCardapio.ingredientes];
        novosIngredientes.splice(index, 1); // Remove o ingrediente na posição index
        setNovoCardapio({ ...novoCardapio, ingredientes: novosIngredientes });
    };

    const carregarEstoque = async () => {
        try {
            const data = await consultarEstoque();
            if (data.status === "success") {
                setEstoque(data.data);
            } else {
                alert(`Erro ao carregar estoque: ${data.message}`);
            }
        } catch (error) {
            console.error("Erro ao carregar estoque:", error);
            alert("Erro ao carregar estoque. Verifique o console.");
        }
    };

    useEffect(() => {
        carregarCardapios();
        carregarEstoque();
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/Login");
        }
    }, [status, router]);

    if (status === "loading") {
        return <div>Carregando...</div>;
    }

    const handleAddIngrediente = () => {
        if (isEditing && editCardapioData) {
            setEditCardapioData((prev: any) => ({
                ...prev,
                ingredientes: [...prev.ingredientes, { item_estoque_id: "", quantidade: 0, referencia_quantidade: "" }],
            }));
        } else {
            setNovoCardapio((prev) => ({
                ...prev,
                ingredientes: [...prev.ingredientes, { item_estoque_id: "", quantidade: 0, referencia_quantidade: "" }],
            }));
        }
    };

    const adicionarCardapio = async () => {
        try {
            const resultado = await criarCardapio(novoCardapio);
            if (resultado.status === "success") {
                alert("Cardápio adicionado com sucesso!");
                carregarCardapios();
                setShowModal(false);
                setNovoCardapio({
                    nome: "",
                    ingredientes: [],
                });
            } else {
                alert(`Erro ao adicionar cardápio: ${resultado.message}`);
            }
        } catch (error) {
            console.error("Erro ao adicionar cardápio:", error);
            alert("Erro ao adicionar cardápio. Por favor, tente novamente.");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (isEditing && editCardapioData) {
            setEditCardapioData((prev: any) => ({
                ...prev,
                [name]: value
            }));
        } else {
            setNovoCardapio((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleIngredienteChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>, index: number) => {
        const { name, value } = e.target;
        if (isEditing && editCardapioData) {
            const updatedIngredientes = editCardapioData.ingredientes.map((ingrediente: IngredienteModel, i: number) => {
                if (i === index) {
                    if (name === "item_estoque_id") {
                        const item = estoque.find((est) => est._id === value);
                        return {
                            ...ingrediente,
                            [name]: value,
                            referencia_quantidade: item?.referencia_quantidade ?? "",
                        };
                    } else {
                        return {
                            ...ingrediente,
                            [name]: value
                        };
                    }
                }
                return ingrediente;
            });
            setEditCardapioData((prev: any) => ({ ...prev, ingredientes: updatedIngredientes }));
        } else {
            const updatedIngredientes = novoCardapio.ingredientes.map((ingrediente, i) => {
                if (i === index) {
                    if (name === "item_estoque_id") {
                        const item = estoque.find((est) => est._id === value);
                        return {
                            ...ingrediente,
                            [name]: value,
                            referencia_quantidade: item?.referencia_quantidade ?? "",
                        };
                    } else {
                        return {
                            ...ingrediente,
                            [name]: value
                        };
                    }
                }
                return ingrediente;
            });
            setNovoCardapio((prev) => ({
                ...prev,
                ingredientes: updatedIngredientes,
            }));
        }
    };

    const handleEditClick = (cardapio: NovoCardapio) => {
        setIsEditing(true);
        settempCardapio({ ...cardapio });
        setEditCardapioData({ ...cardapio });
    };

    const atualizarCardapio = async () => {
        if (!editCardapioData || !editCardapioData._id) {
            alert("Erro ao editar cardápio: ID do cardápio inválido.");
            return;
        }
        try {
            const resultado = await editarCardapio(editCardapioData);
            if (resultado.status === "success") {
                alert("Cardápio atualizado com sucesso!");
                carregarCardapios();
                setIsEditing(false);
                setEditCardapioData(null);
                settempCardapio(null);
            } else {
                alert(`Erro ao atualizar cardápio: ${resultado.message}`);
            }
        } catch (error) {
            console.error("Erro ao atualizar cardapio:", error);
            alert("Erro ao atualizar cardapio no estoque. Por favor, tente novamente.");
        }
    };

    const handlePrepareCardapio = async (cardapio: NovoCardapio) => {
        const quantidadePratos = prompt("Quantos pratos você deseja preparar?", "1");
        if (quantidadePratos) {
            try {
                const result = await prepararCardapio(cardapio._id as string, Number(quantidadePratos)); //cast para string
                if (result.status === "success") {
                    alert("Cardápio preparado com sucesso");
                    carregarCardapios();
                    carregarEstoque();
                }
            } catch (error: any) {
                console.log("Erro ao preparar cardápio:", error);
                alert(`Erro ao preparar o cardápio: ${error.message}`);
            }
        }
    };

    const handleDeleteCardapio = async (cardapioId: string) => {
        if (window.confirm("Tem certeza de que deseja excluir este cardápio?")) {
            try {
                const result = await excluirCardapio(cardapioId);

                if (result.status === "success") {
                    alert("Cardápio excluído com sucesso!");
                    carregarCardapios(); // Recarrega os cardápios após a exclusão
                } else {
                    alert(`Erro ao excluir cardápio: ${result.message}`);
                }
            } catch (error) {
                console.error("Erro ao excluir cardápio:", error);
                alert("Erro ao excluir cardápio. Por favor, tente novamente.");
            }
        }
    };

    const cardapioFiltrado = cardapios.filter((cardapio) =>
        cardapio.nome.toLowerCase().includes(searchValue.toLowerCase())
    );

    return (
        <div className="bg-primary-gray h-screen flex">
            <Sidebar />
            <div className="flex-1 bg-white flex flex-col pl-72 ml-3">
                <header className="flex justify-between items-center p-6 border-b border-[#E8E8E8] bg-white">
                    <div>
                        <h2 className="text-4xl font-bold text-slate-900 mb-2">Cardápios</h2>
                        <h3 className="text-xl text-gray-600">Lista de cardápios criados!</h3>
                    </div>
                    <div className="flex items-center space-x-6 mr-10 relative">
                        <button
                            onClick={() => setShowModal(true)}
                            className="p-4 bg-primary-orange text-white text-xl font-poppins rounded-2xl border-2 border-[#3C3C3C]"
                        >
                            INSERIR CARDÁPIO
                        </button>
                        <button
                            className="p-4 border rounded-2xl border-[#3C3C3C] text-black hover:bg-gray-100"
                            onClick={() => setShowInput(!showInput)}
                        >
                            <Search />
                        </button>
                        {showInput && (
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className={`absolute top-full right-0 mt-2 w-64 p-2 border rounded-xl text-black border-gray-300 focus:outline-none focus:ring focus:ring-primary-orange transition-transform duration-300 ease-in-out ${showInput ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
                                    }`}
                                placeholder="Digite para buscar..."
                            />
                        )}
                    </div>
                </header>
                <main className="flex-1 p-6 bg-primary-gray text-black">
                    <h3 className="text-xl font-semibold mb-4">Lista de Cardápios</h3>
                    <table className="table-auto w-11/12 bg-white border border-gray-300 rounded-lg">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-4 text-left border-b">Nome</th>
                                <th className="p-4 text-left border-b">Ingredientes</th>
                                <th className="p-4 text-left border-b">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cardapioFiltrado.map((cardapio, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="p-4 border-b">{cardapio.nome}</td>
                                    <td className="p-4 border-b">
                                        <ul className="list-disc pl-4">
                                            {cardapio.ingredientes?.map((ingrediente: IngredienteModel, i: number) => (
                                                <li key={i}>
                                                    {estoque.find(item => item._id === ingrediente.item_estoque_id)?.item}

                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="p-4 border-b">
                                        <button
                                            onClick={() => handleEditClick(cardapio)}
                                            className="px-2 py-1 bg-primary-orange text-white rounded-md mr-2"
                                        >
                                            <Pencil/>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCardapio(cardapio._id as string)}
                                            className="px-2 py-1 bg-red-500 text-white rounded-md"
                                        >
                                            <X/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {cardapioFiltrado.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center p-4">
                                        Nenhum item encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </main>
            </div>
            {showModal && !isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg" style={{ width: "1000px" }} >
                        <h1 className="text-2xl font-semibold mb-4 text-black ">Adicionar Cardápio</h1>
                        <p className="text-sm text-black mb-4"> * Insira a quantidade por pessoa para cada ingrediente.</p>
                        <div className="space-y-4 text-black">
                            <input
                                type="text"
                                name="nome"
                                value={novoCardapio.nome}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="Nome do cardápio"
                            />
                            <div className="container-ingredientes">
                                {novoCardapio.ingredientes.map((ingrediente, index) => (
                                    <div key={index} className="Ingrediente-container">
                                        <select
                                            name="item_estoque_id"
                                            value={ingrediente.item_estoque_id}
                                            onChange={(e) => handleIngredienteChange(e as React.ChangeEvent<HTMLSelectElement>, index)}
                                            className="igrediente-select"
                                        >
                                            <option value="">Selecione um item</option>
                                            {estoque.map((item: NovoItem) => (
                                                <option key={item._id} value={item._id}>{item.item}</option>
                                            ))}
                                        </select>
                                        <div className="Campo-quantidade mr-2">
                                            <input
                                                type="number"
                                                name="quantidade"
                                                value={ingrediente.quantidade}
                                                onChange={(e) => handleIngredienteChange(e as React.ChangeEvent<HTMLInputElement>, index)}
                                                className="w-full p-2 border border-gray-300 rounded-md"
                                                placeholder="Quantidade"
                                            />
                                            <span className="text-black text-lg ml-2">
                                                {estoque.find((item) => item._id === ingrediente.item_estoque_id)?.referencia_quantidade || ""}
                                            </span>
                                        </div>
                                        <button
                                            className="botao-excluir"
                                            onClick={() => removerIngrediente(index)}
                                        >
                                            <Trash size={18} />
                                        </button>

                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddIngrediente} className="px-4 py-2 bg-gray-300 text-black rounded-md">
                                Adicionar Ingrediente
                            </button>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-300 text-black rounded-md"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={adicionarCardapio}
                                className="px-4 py-2 bg-[#21c900] text-white rounded-md"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showModal && !isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg" style={{ width: "1000px" }}>
                        <h1 className="text-2xl font-semibold mb-4 text-black">Adicionar Cardápio</h1>
                        <p className="text-sm text-black mb-4">* Insira a quantidade por pessoa para cada ingrediente.</p>
                        <div className="space-y-4 text-black">
                              <input
                                type="text"
                                name="nome"
                                value={novoCardapio.nome}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="Nome do cardápio"
                            />
                            <div className="container-ingredientes grid grid-cols-2 gap-4">
                                {novoCardapio.ingredientes.map((ingrediente, index) => (
                                    <div key={index} className="Ingrediente-container flex flex-col gap-2">
                                        <select
                                            name="item_estoque_id"
                                            value={ingrediente.item_estoque_id}
                                            onChange={(e) => handleIngredienteChange(e, index)}
                                            className="igrediente-select p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">Selecione um item</option>
                                            {estoque.map((item) => (
                                                <option key={item._id} value={item._id}>{item.item}</option>
                                            ))}
                                        </select>
                                        <div className="Campo-quantidade flex items-center">
                                        <input
                                            type="number"
                                            name="quantidade"
                                            value={ingrediente.quantidade}
                                            onChange={(e) => {
                                                const value = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                handleIngredienteChange({ target: { name: e.target.name, value: value.toString() } } as React.ChangeEvent<HTMLInputElement>, index);
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="Quantidade"
                                            min="0"
                                        />
                                            <span className="text-black text-lg ml-2">
                                                {estoque.find((item) => item._id === ingrediente.item_estoque_id)?.referencia_quantidade || ""}
                                            </span>
                                        </div>
                                        <button
                                            className="botao-excluir p-2 bg-red-500 text-white rounded-md"
                                            onClick={() => removerIngrediente(index)}
                                        >
                                            <p>Excluir</p>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddIngrediente} className="px-4 py-2 bg-gray-300 text-black rounded-md">
                                Adicionar Ingrediente
                            </button>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-300 text-black rounded-md"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={adicionarCardapio}
                                className="px-4 py-2 bg-[#21c900] text-white rounded-md"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditing && tempCardapio && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg" style={{ width: "1000px" }}>
                        <h1 className="text-2xl font-semibold mb-4 text-black">Editar Cardápio</h1>
                        <p className="text-sm text-black mb-4">* Insira a quantidade por pessoa para cada ingrediente.</p>
                        <div className="space-y-4 text-black">
                            <input
                                type="text"
                                name="nome"
                                value={editCardapioData?.nome}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="Nome do cardápio"
                            />
                            
                            <div className="container-ingredientes grid grid-cols-2 gap-4">
                                {editCardapioData?.ingredientes?.map((ingrediente, index) => (
                                    <div key={index} className="Ingrediente-container flex flex-col gap-2">
                                        <select
                                            name="item_estoque_id"
                                            value={ingrediente.item_estoque_id}
                                            onChange={(e) => handleIngredienteChange(e, index)}
                                            className="igrediente-select p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">Selecione um item</option>
                                            {estoque.map((item) => (
                                                <option key={item._id} value={item._id}>{item.item}</option>
                                            ))}
                                        </select>
                                        <div className="Campo-quantidade flex items-center">
                                        <input
                                            type="number"
                                            name="quantidade"
                                            value={ingrediente.quantidade}
                                            onChange={(e) => {
                                                const value = Math.max(0, parseInt(e.target.value, 10) || 0);
                                                handleIngredienteChange({ target: { name: e.target.name, value: value.toString() } } as React.ChangeEvent<HTMLInputElement>, index);
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                            placeholder="Quantidade"
                                            min="0"
                                        />
                                            <span className="text-black text-lg ml-2">
                                                {estoque.find((item) => item._id === ingrediente.item_estoque_id)?.referencia_quantidade || ""}
                                            </span>
                                        </div>
                                        <button
                                            className="botao-excluir p-2 bg-red-500 text-white rounded-md"
                                            onClick={() => removerIngrediente_edit(index)}
                                        >
                                            <p>Excluir</p>
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleAddIngrediente} className="px-4 py-2 bg-gray-300 text-black rounded-md">
                                Adicionar Ingrediente
                            </button>
                        </div>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 bg-gray-300 text-black rounded-md"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={atualizarCardapio}
                                className="px-4 py-2 bg-primary-orange text-white rounded-md"
                            >
                                Atualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}