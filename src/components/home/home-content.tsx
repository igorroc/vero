"use client";

import Link from "next/link";
import {Button} from "@nextui-org/react";
import {
    ArrowRight,
    BarChart3,
    Calendar,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    LineChart,
    PiggyBank,
    Shield,
    Sparkles,
    Target,
    TrendingUp,
    Wallet,
    Zap,
} from "lucide-react";

export function HomeContent() {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950">
            {/* Navigation */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white"/>
                            </div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">Vero</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features"
                               className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
                                Funcionalidades
                            </a>
                            <a href="#how-it-works"
                               className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
                                Como Funciona
                            </a>
                            <a href="#benefits"
                               className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
                                Benefícios
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                as={Link}
                                href="/auth/login"
                                variant="light"
                                className="font-medium"
                            >
                                Entrar
                            </Button>
                            <Button
                                as={Link}
                                href="/auth/register"
                                color="primary"
                                className="font-medium"
                            >
                                Criar Conta
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-4xl mx-auto">
                        <div
                            className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Sparkles className="w-4 h-4"/>
                            Seu copiloto financeiro pessoal
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
                            Pare de se perguntar.
                            <br/>
                            <span
                                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                Comece a planejar.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
                            O Vero te ajuda a entender o que vai acontecer com seu dinheiro,
                            quanto você pode gastar por dia e como crescer seu patrimônio de forma intencional.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                as={Link}
                                href="/auth/register"
                                color="primary"
                                size="lg"
                                className="font-semibold px-8"
                                endContent={<ArrowRight className="w-5 h-5"/>}
                            >
                                Comece Gratuitamente
                            </Button>
                            <Button
                                as={Link}
                                href="#how-it-works"
                                variant="bordered"
                                size="lg"
                                className="font-semibold px-8"
                            >
                                Veja Como Funciona
                            </Button>
                        </div>
                    </div>

                    {/* Hero Stats */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">90</div>
                            <div className="text-slate-600 dark:text-slate-400">dias de projeção</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">100%</div>
                            <div className="text-slate-600 dark:text-slate-400">gratuito</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">24/7</div>
                            <div className="text-slate-600 dark:text-slate-400">disponível</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-900 dark:text-white">0</div>
                            <div className="text-slate-600 dark:text-slate-400">anúncios</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Problem Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Você sabe quanto pode gastar hoje?
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            A maioria das pessoas controla gastos olhando para o passado.
                            O Vero inverte essa lógica: te mostra o futuro para você decidir melhor no presente.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
                            <div
                                className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4">
                                <CreditCard className="w-6 h-6 text-red-600 dark:text-red-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Sem surpresas no fim do mês
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Visualize todas as contas e receitas antes que elas aconteçam.
                                Nunca mais seja pego de surpresa.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
                            <div
                                className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-4">
                                <Target className="w-6 h-6 text-amber-600 dark:text-amber-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Limite diário inteligente
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Saiba exatamente quanto pode gastar por dia considerando suas
                                contas futuras e reserva de segurança.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm">
                            <div
                                className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400"/>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Cresça seu patrimônio
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Planeje investimentos recorrentes e acompanhe sua jornada
                                rumo às suas metas financeiras.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div
                            className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <Zap className="w-4 h-4"/>
                            Funcionalidades
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Tudo que você precisa para
                            <br/>
                            <span
                                className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                                controlar suas finanças
                            </span>
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Ferramentas poderosas e simples de usar para você tomar as melhores decisões financeiras.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div
                            className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <BarChart3 className="w-6 h-6 text-white"/>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Dashboard Inteligente
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Visão completa da sua saúde financeira em tempo real.
                                Saldo total, limite diário, projeções e alertas importantes.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div
                            className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 transition-all hover:shadow-lg">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <LineChart className="w-6 h-6 text-white"/>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Fluxo de Caixa
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Projeção dia a dia para os próximos 30, 60 ou 90 dias.
                                Identifique dias críticos antes que eles aconteçam.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div
                            className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-lg">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Wallet className="w-6 h-6 text-white"/>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Limite de Gastos
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Descubra quanto pode gastar por dia com segurança,
                                considerando despesas futuras e sua reserva de emergência.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div
                            className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 transition-all hover:shadow-lg">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Calendar className="w-6 h-6 text-white"/>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Eventos Recorrentes
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Configure receitas e despesas que se repetem automaticamente.
                                Diário, semanal, quinzenal, mensal ou anual.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div
                            className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 transition-all hover:shadow-lg">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <PiggyBank className="w-6 h-6 text-white"/>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Planos de Investimento
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Automatize seus aportes mensais e acompanhe o progresso
                                rumo às suas metas de patrimônio.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div
                            className="group p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 transition-all hover:shadow-lg">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Shield className="w-6 h-6 text-white"/>
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Reserva de Segurança
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Defina um valor mínimo que você quer manter em conta.
                                O sistema nunca vai sugerir gastar sua reserva.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works Section */}
            <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <div
                            className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
                            <CheckCircle2 className="w-4 h-4"/>
                            Simples de Usar
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                            Como o Vero funciona
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400">
                            Em poucos minutos você já terá uma visão clara do seu futuro financeiro.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="relative">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                                1
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Cadastre suas contas
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Adicione suas contas bancárias, dinheiro em espécie e contas de investimento com o saldo
                                atual.
                            </p>
                            <div
                                className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent"/>
                        </div>

                        <div className="relative">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                                2
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Adicione eventos futuros
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Cadastre suas receitas e despesas conhecidas: salário, aluguel, contas fixas, etc.
                            </p>
                            <div
                                className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent"/>
                        </div>

                        <div className="relative">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                                3
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Veja o futuro
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                O dashboard mostra sua projeção financeira, limite diário e alertas importantes.
                            </p>
                            <div
                                className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent"/>
                        </div>

                        <div>
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                                4
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                Confirme quando acontecer
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                Quando um evento realmente acontecer, confirme para atualizar seu saldo real.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div
                                className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
                                <Target className="w-4 h-4"/>
                                Benefícios
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-6">
                                Por que usar o Vero?
                            </h2>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div
                                        className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400"/>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                            Tome decisões com confiança
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Saber quanto pode gastar por dia elimina a ansiedade financeira.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div
                                        className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400"/>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                            Evite emergências financeiras
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Identifique problemas com semanas de antecedência e tenha tempo para agir.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div
                                        className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400"/>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                            Construa patrimônio de forma intencional
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Planeje investimentos recorrentes e veja seu patrimônio crescer.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div
                                        className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400"/>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                                            Simples e direto ao ponto
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            Sem categorização manual de cada gasto. Foco no que importa: o futuro.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
                            <h3 className="text-2xl font-bold mb-6">
                                A pergunta que o Vero responde:
                            </h3>
                            <div className="space-y-4">
                                <div className="bg-white/10 rounded-xl p-4">
                                    <p className="text-lg font-medium">
                                        &quot;Quanto posso gastar hoje sem comprometer meu futuro?&quot;
                                    </p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-4">
                                    <p className="text-lg font-medium">
                                        &quot;O que vai acontecer com meu dinheiro nos próximos 90 dias?&quot;
                                    </p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-4">
                                    <p className="text-lg font-medium">
                                        &quot;Estou no caminho certo para crescer meu patrimônio?&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-700">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Pronto para tomar o controle das suas finanças?
                    </h2>
                    <p className="text-xl text-blue-100 mb-10">
                        Comece agora mesmo. É gratuito e leva menos de 5 minutos para configurar.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            as={Link}
                            href="/auth/register"
                            size="lg"
                            className="bg-white text-blue-600 font-semibold px-8 hover:bg-blue-50"
                            endContent={<ChevronRight className="w-5 h-5"/>}
                        >
                            Criar Conta Grátis
                        </Button>
                        <Button
                            as={Link}
                            href="/auth/login"
                            variant="bordered"
                            size="lg"
                            className="border-white text-white font-semibold px-8 hover:bg-white/10"
                        >
                            Já tenho uma conta
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white"/>
                            </div>
                            <span className="text-xl font-bold text-white">Vero</span>
                        </div>
                        <p className="text-slate-400 text-center">
                            Vero - Seu copiloto financeiro pessoal. Planeje seu futuro com confiança.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link href="/auth/login" className="text-slate-400 hover:text-white transition">
                                Entrar
                            </Link>
                            <Link href="/auth/register" className="text-slate-400 hover:text-white transition">
                                Criar Conta
                            </Link>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
                        &copy; {new Date().getFullYear()} Vero. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
