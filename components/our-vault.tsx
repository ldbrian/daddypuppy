"use client"

import { useState, useEffect } from "react"
import { PiggyBank, Plus, Minus, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import PlayfulCard from "@/components/playful-card"
import { loadJSON, saveJSON } from "@/lib/storage"
import type { Language } from "@/lib/types"
import { Role } from "@/src/types/Role"

interface VaultTransaction {
  id: string
  amount: number
  type: "deposit" | "withdraw"
  currency: "CNY" | "IDR"
  description: string
  timestamp: string
}

interface VaultData {
  balance: {
    CNY: number
    IDR: number
  }
  transactions: VaultTransaction[]
}

export default function OurVault({ 
  language = "zh",
  currentUser = Role.DADDY
}: { 
  language?: Language
  currentUser?: Role
}) {
  const [vaultData, setVaultData] = useState<VaultData>({
    balance: { CNY: 0, IDR: 0 },
    transactions: []
  })
  const [showTransactionDialog, setShowTransactionDialog] = useState(false)
  const [transactionType, setTransactionType] = useState<"deposit" | "withdraw">("deposit")
  const [amount, setAmount] = useState("")
  const [description, setDescription] = useState("")
  const [currency, setCurrency] = useState<"CNY" | "IDR">(currentUser === Role.DADDY ? "CNY" : "IDR")
  const [isLoading, setIsLoading] = useState(true)
  const [editingBalance, setEditingBalance] = useState(false)
  const [editCNY, setEditCNY] = useState("0")
  const [editIDR, setEditIDR] = useState("0")

  const t = {
    zh: {
      title: "我们的金库",
      currentBalance: "当前存款",
      deposit: "存入",
      withdraw: "取出",
      edit: "编辑",
      save: "保存",
      cancel: "取消",
      transaction: "交易",
      amount: "金额",
      description: "说明",
      currency: "货币类型",
      cny: "人民币 (CNY)",
      idr: "印尼币 (IDR)",
      depositAction: "存入",
      withdrawAction: "取出",
      noTransactions: "暂无交易记录",
      loading: "加载中...",
      recentTransactions: "最近交易",
      balanceUpdated: "余额已更新",
      transactionCompleted: "交易完成",
      invalidAmount: "请输入有效金额",
      insufficientFunds: "余额不足"
    },
    en: {
      title: "Our Vault",
      currentBalance: "Current Balance",
      deposit: "Deposit",
      withdraw: "Withdraw",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      transaction: "Transaction",
      amount: "Amount",
      description: "Description",
      currency: "Currency Type",
      cny: "Chinese Yuan (CNY)",
      idr: "Indonesian Rupiah (IDR)",
      depositAction: "Deposit",
      withdrawAction: "Withdraw",
      noTransactions: "No transactions yet",
      loading: "Loading...",
      recentTransactions: "Recent Transactions",
      balanceUpdated: "Balance updated",
      transactionCompleted: "Transaction completed",
      invalidAmount: "Please enter a valid amount",
      insufficientFunds: "Insufficient funds"
    }
  }

  const currentT = t[language]

  useEffect(() => {
    const loadVaultData = async () => {
      try {
        setIsLoading(true)
        const savedData = await loadJSON<VaultData>("memoir_vault", {
          balance: { CNY: 0, IDR: 0 },
          transactions: []
        })
        
        // 确保balance对象存在并有正确的属性
        const validVaultData = {
          balance: {
            CNY: savedData?.balance?.CNY || 0,
            IDR: savedData?.balance?.IDR || 0
          },
          transactions: Array.isArray(savedData?.transactions) ? savedData.transactions : []
        }
        
        setVaultData(validVaultData)
        setEditCNY(validVaultData.balance.CNY.toString())
        setEditIDR(validVaultData.balance.IDR.toString())
      } catch (error) {
        console.error("Failed to load vault data:", error)
        // 出错时使用默认值
        const defaultData = {
          balance: { CNY: 0, IDR: 0 },
          transactions: []
        }
        setVaultData(defaultData)
        setEditCNY("0")
        setEditIDR("0")
      } finally {
        setIsLoading(false)
      }
    }

    loadVaultData()
  }, [])

  const saveVaultData = async (newData: VaultData) => {
    try {
      await saveJSON("memoir_vault", newData)
    } catch (error) {
      console.error("Failed to save vault data:", error)
    }
  }

  const handleTransaction = async () => {
    const amountValue = parseFloat(amount)
    if (isNaN(amountValue) || amountValue <= 0) {
      alert(currentT.invalidAmount)
      return
    }

    // 检查余额是否足够（取出时）
    if (transactionType === "withdraw" && vaultData?.balance?.[currency] !== undefined && vaultData.balance[currency] < amountValue) {
      alert(currentT.insufficientFunds)
      return
    }

    const newTransaction: VaultTransaction = {
      id: Date.now().toString(),
      amount: amountValue,
      type: transactionType,
      currency,
      description: description || (transactionType === "deposit" ? currentT.depositAction : currentT.withdrawAction),
      timestamp: new Date().toISOString()
    }

    const updatedBalance = { 
      CNY: vaultData?.balance?.CNY || 0,
      IDR: vaultData?.balance?.IDR || 0
    }
    
    if (transactionType === "deposit") {
      updatedBalance[currency] += amountValue
    } else {
      updatedBalance[currency] -= amountValue
    }

    const updatedData = {
      balance: updatedBalance,
      transactions: [newTransaction, ...(vaultData?.transactions?.slice(0, 9) || [])] // 只保留最近10条记录
    }

    setVaultData(updatedData)
    await saveVaultData(updatedData)
    
    // 重置表单
    setAmount("")
    setDescription("")
    setShowTransactionDialog(false)
  }

  const handleSaveBalance = async () => {
    // 将输入值转换为数字
    const cnyValue = parseFloat(editCNY)
    const idrValue = parseFloat(editIDR)
    
    // 验证输入值是否有效
    if (isNaN(cnyValue) || isNaN(idrValue) || cnyValue < 0 || idrValue < 0) {
      alert(currentT.invalidAmount)
      return
    }

    // 创建更新后的数据对象
    const updatedData = {
      ...vaultData,
      balance: {
        CNY: cnyValue,
        IDR: idrValue
      }
    }

    // 更新本地状态
    setVaultData(updatedData)
    
    // 保存到持久化存储
    await saveVaultData(updatedData)
    
    // 关闭编辑模式
    setEditingBalance(false)
    
    // 显示成功提示
    alert(currentT.balanceUpdated)
  }

  const formatCurrency = (amount: number, currency: "CNY" | "IDR") => {
    if (language === "zh") {
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: currency === "IDR" ? 0 : 2,
        maximumFractionDigits: currency === "IDR" ? 0 : 2
      }).format(amount)
    } else {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: currency === "IDR" ? 0 : 2,
        maximumFractionDigits: currency === "IDR" ? 0 : 2
      }).format(amount)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (language === "zh") {
      return date.toLocaleDateString("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    }
  }

  if (isLoading) {
    return (
      <PlayfulCard tiltSeed="ourvault" className="p-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-neutral-500 text-sm">{currentT.loading}</div>
        </div>
      </PlayfulCard>
    )
  }

  return (
    <>
      <PlayfulCard tiltSeed="ourvault" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PiggyBank className="size-4 text-pink-600" />
            <h3 className="font-semibold tracking-wide">{currentT.title}</h3>
          </div>
          <div className="flex gap-1">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setEditingBalance(true)
                setEditCNY(vaultData.balance.CNY.toString())
                setEditIDR(vaultData.balance.IDR.toString())
              }}
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              <Edit3 className="size-3" />
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                setTransactionType("deposit")
                setCurrency(currentUser === Role.DADDY ? "CNY" : "IDR")
                setDescription("")
                setAmount("")
                setShowTransactionDialog(true)
              }} 
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <Plus className="size-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setTransactionType("withdraw")
                setCurrency(currentUser === Role.DADDY ? "CNY" : "IDR")
                setDescription("")
                setAmount("")
                setShowTransactionDialog(true)
              }}
              className="border-pink-200 text-pink-600 hover:bg-pink-50"
            >
              <Minus className="size-4" />
            </Button>
          </div>
        </div>

        {/* 当前余额显示 */}
        <div className="mb-6">
          <h4 className="text-xs font-medium text-neutral-600 mb-2">{currentT.currentBalance}</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-pink-50 rounded-md">
              <span className="text-sm font-medium text-pink-700">CNY</span>
              <span className="font-semibold">
                {vaultData?.balance?.CNY !== undefined ? formatCurrency(vaultData.balance.CNY, "CNY") : '¥0.00'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-rose-50 rounded-md">
              <span className="text-sm font-medium text-rose-700">IDR</span>
              <span className="font-semibold">
                {vaultData?.balance?.IDR !== undefined ? formatCurrency(vaultData.balance.IDR, "IDR") : 'Rp0'}
              </span>
            </div>
          </div>
        </div>

        {/* 最近交易记录 */}
        <div>
          <h4 className="text-xs font-medium text-neutral-600 mb-2">{currentT.recentTransactions}</h4>
          {vaultData.transactions.length === 0 ? (
            <div className="text-center py-4">
              <PiggyBank className="size-8 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs text-neutral-500">{currentT.noTransactions}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {vaultData.transactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-2 bg-white border border-neutral-200 rounded-md text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {transaction.type === "deposit" ? (
                        <Plus className="size-3 text-green-600" />
                      ) : (
                        <Minus className="size-3 text-red-600" />
                      )}
                      <span className="truncate">{transaction.description}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-neutral-500 ml-5">
                      <span>{formatDate(transaction.timestamp)}</span>
                      <span>{transaction.currency}</span>
                    </div>
                  </div>
                  <div className={`font-medium ${transaction.type === "deposit" ? "text-green-600" : "text-red-600"}`}>
                    {transaction.type === "deposit" ? "+" : "-"}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PlayfulCard>

      {/* 交易对话框 */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {transactionType === "deposit" ? currentT.depositAction : currentT.withdrawAction} {currentT.transaction}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">{currentT.amount}</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-1"
                step="0.01"
                min="0"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700">{currentT.currency}</label>
              <Select value={currency} onValueChange={(value: "CNY" | "IDR") => setCurrency(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="CNY">{currentT.cny}</SelectItem>
                  <SelectItem value="IDR">{currentT.idr}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700">{currentT.description}</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={transactionType === "deposit" ? currentT.depositAction : currentT.withdrawAction}
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowTransactionDialog(false)}
                className="flex-1"
              >
                {currentT.cancel}
              </Button>
              <Button 
                onClick={handleTransaction}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              >
                {transactionType === "deposit" ? currentT.depositAction : currentT.withdrawAction}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑余额对话框 */}
      <Dialog open={editingBalance} onOpenChange={setEditingBalance}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{currentT.edit} {currentT.currentBalance}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-neutral-700">CNY ({currentT.cny})</label>
              <Input
                type="number"
                value={editCNY}
                onChange={(e) => setEditCNY(e.target.value)}
                className="mt-1"
                step="0.01"
                min="0"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-neutral-700">IDR ({currentT.idr})</label>
              <Input
                type="number"
                value={editIDR}
                onChange={(e) => setEditIDR(e.target.value)}
                className="mt-1"
                step="1"
                min="0"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingBalance(false)}
                className="flex-1"
              >
                {currentT.cancel}
              </Button>
              <Button 
                onClick={handleSaveBalance}
                className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
              >
                {currentT.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}