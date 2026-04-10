import csv
import random
from datetime import datetime, timedelta

# CONFIGURATION
NUM_WEEKS = 52
START_DATE = datetime(2025, 1, 1)
ICE_OPTIONS = ["No Ice", "Less Ice", "Regular Ice", "Extra Ice"]
SUGAR_OPTIONS = ["0%", "25%", "50%", "75%", "100%"]
TOPPING_OPTIONS = ["None", "Boba", "Pudding", "Grass Jelly", "Red Bean", "Aloe Vera"]
TARGET_REVENUE = 1_000_000
NUM_MENU_ITEMS = 20
NUM_EMPLOYEES = 8
NUM_INVENTORY_ITEMS = 25

# 3 peak sales days
PEAK_DAYS = [
    datetime(2025, 2, 14),
    datetime(2025, 7, 4),
    datetime(2025, 12, 25)
]

# HELPER FUNCTIONS
def random_time():
    hour = random.randint(10, 21)  # store hours 10AM–9PM
    minute = random.randint(0, 59)
    return hour, minute

# --- INVENTORY ---
inventory_names = [
    "Cup (16oz)", "Cup Lid", "Straw",
    "Black Tea Leaves", "Green Tea Leaves", "Oolong Tea Leaves",
    "Milk", "Almond Milk", "Oat Milk",
    "Tapioca Pearls (Boba)", "Brown Sugar Syrup",
    "Honey", "Simple Syrup",
    "Taro Powder", "Matcha Powder",
    "Thai Tea Mix", "Wintermelon Syrup",
    "Passionfruit Syrup", "Lychee Syrup",
    "Peach Syrup", "Mango Syrup",
    "Strawberry Syrup", "Guava Syrup",
    "Pineapple Syrup", "Red Bean"
]

NUM_INVENTORY_ITEMS = len(inventory_names)
inventory_items = []


for i, name in enumerate(inventory_names, start=1):
    inventory_items.append([
        i,
        name,
        round(random.uniform(0.50, 5.00), 2),
        random.randint(500, 2000),
        random.randint(1, 5)
    ])

with open("inventory.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["inventoryID", "name", "cost", "inventoryNum", "useAverage"])
    writer.writerows(inventory_items)

# --- MENU (20 BOBA DRINKS) ---
drink_names = [
    "Classic Milk Tea", "Taro Milk Tea", "Matcha Milk Tea",
    "Thai Milk Tea", "Honeydew Milk Tea", "Brown Sugar Milk Tea",
    "Strawberry Milk Tea", "Mango Milk Tea", "Oolong Milk Tea",
    "Wintermelon Tea", "Passionfruit Tea", "Lychee Tea",
    "Peach Green Tea", "Coconut Milk Tea", "Almond Milk Tea",
    "Coffee Milk Tea", "Red Bean Milk Tea", "Pineapple Tea",
    "Guava Green Tea", "Caramel Milk Tea"
]

drink_images = {
"Classic Milk Tea": "https://images.unsplash.com/photo-1601489310882-d2fb4451dbcc?auto=format&fit=crop&q=80&w=800",
  "Taro Milk Tea": "https://upload.wikimedia.org/wikipedia/commons/a/a3/Taro_flavored_milk_tea.jpg",
  "Matcha Milk Tea": "https://images.unsplash.com/photo-1759363580278-058211df7102?auto=format&fit=crop&q=80&w=800",
  "Thai Milk Tea": "https://images.unsplash.com/photo-1707578365460-f92c22d18a24?auto=format&fit=crop&q=80&w=800",
  "Honeydew Milk Tea": "https://images.unsplash.com/photo-1773487743024-756afae04b87?auto=format&fit=crop&q=80&w=800",
  "Brown Sugar Milk Tea": "https://images.unsplash.com/photo-1756132540944-ad87ca91f358?auto=format&fit=crop&q=80&w=800",
  "Strawberry Milk Tea": "https://images.unsplash.com/photo-1647201201594-dff923210b3a?auto=format&fit=crop&q=80&w=800",
  "Mango Milk Tea": "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=800",
  "Oolong Milk Tea": "https://images.unsplash.com/photo-1652780080440-9067470afc94?auto=format&fit=crop&q=80&w=800",
  "Wintermelon Tea": "https://images.unsplash.com/photo-1773487742962-987ec2f20bad?auto=format&fit=crop&q=80&w=800",
  "Passionfruit Tea": "https://images.unsplash.com/photo-1606673993554-a5f993a16e0d?auto=format&fit=crop&q=80&w=800",
  "Lychee Tea": "https://images.unsplash.com/photo-1599767431130-41b1c51d9a7b?auto=format&fit=crop&q=80&w=800",
  "Peach Green Tea": "https://images.unsplash.com/photo-1694019835724-c8a1b92e37c7?auto=format&fit=crop&q=80&w=800",
  "Coconut Milk Tea": "https://images.unsplash.com/photo-1645231286309-2beccdfae91c?auto=format&fit=crop&q=80&w=800",
  "Almond Milk Tea": "https://images.unsplash.com/photo-1601436423474-51738541c1b1?auto=format&fit=crop&q=80&w=800",
  "Coffee Milk Tea": "https://images.unsplash.com/photo-1637273484213-3b41dfbdcf99?auto=format&fit=crop&q=80&w=800",
  "Red Bean Milk Tea": "https://images.unsplash.com/photo-1692263579137-31c58dd2b4a3?auto=format&fit=crop&q=80&w=800",
  "Pineapple Tea": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&q=80&w=800",
  "Guava Green Tea": "https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?auto=format&fit=crop&q=80&w=800",
  "Caramel Milk Tea": "https://images.unsplash.com/photo-1756132540944-ad87ca91f358?auto=format&fit=crop&q=80&w=800"
}

menu_items = []
# Tracker to count total units sold for each menu item
sales_tracker = {i + 1: 0 for i in range(NUM_MENU_ITEMS)}

for i in range(NUM_MENU_ITEMS):
    price = round(random.uniform(4.50, 7.50), 2)
    name = drink_names[i]
    image_url = drink_images.get(name, "")
    # [menuID, name, price, salesNum, image_url]
    menu_items.append([i + 1, name, price, 0, image_url])

# --- MENU_ITEM (bridge table) ---
menu_item_bridge = []
bridge_id = 1

#Always used
CUP = 1
LID = 2
STRAW = 3
BLACK_TEA = 4
GREEN_TEA = 5
OOLONG_TEA = 6
MILK = 7
ALMOND_MILK = 8
OAT_MILK = 9
BOBA = 10
BROWN_SUGAR = 11
HONEY = 12
SIMPLE_SYRUP = 13
TARO = 14
MATCHA = 15
THAI = 16
WINTERMELON = 17
PASSIONFRUIT = 18
LYCHEE = 19
PEACH = 20
MANGO = 21
STRAWBERRY = 22
GUAVA = 23
PINEAPPLE = 24
RED_BEAN = 25

for menu in menu_items:
    menu_id = menu[0]
    drink_name = menu[1]

    ingredients = {CUP, LID, STRAW}

    # Base Tea Logic
    if "Green Tea" in drink_name:
        ingredients.add(GREEN_TEA)
    elif "Oolong" in drink_name:
        ingredients.add(OOLONG_TEA)
    else:
        ingredients.add(BLACK_TEA)

    # Milk Teas
    if "Milk Tea" in drink_name:
        ingredients.add(MILK)
        ingredients.add(BOBA)

    # Specific Flavors
    if "Taro" in drink_name:
        ingredients.add(TARO)

    if "Matcha" in drink_name:
        ingredients.add(MATCHA)

    if "Thai" in drink_name:
        ingredients.add(THAI)

    if "Wintermelon" in drink_name:
        ingredients.add(WINTERMELON)

    if "Passionfruit" in drink_name:
        ingredients.add(PASSIONFRUIT)

    if "Lychee" in drink_name:
        ingredients.add(LYCHEE)

    if "Peach" in drink_name:
        ingredients.add(PEACH)

    if "Mango" in drink_name:
        ingredients.add(MANGO)

    if "Strawberry" in drink_name:
        ingredients.add(STRAWBERRY)

    if "Guava" in drink_name:
        ingredients.add(GUAVA)

    if "Pineapple" in drink_name:
        ingredients.add(PINEAPPLE)

    if "Red Bean" in drink_name:
        ingredients.add(RED_BEAN)

    if "Brown Sugar" in drink_name:
        ingredients.add(BROWN_SUGAR)

    if "Honey" in drink_name:
        ingredients.add(HONEY)

    # Add ingredients to bridge table
    for inv_id in ingredients:
        menu_item_bridge.append([
            bridge_id,
            inv_id,
            menu_id,
            random.randint(1, 3)
        ])
        bridge_id += 1

with open("menu_item.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["ID", "inventoryID", "menuID", "itemQuantity"])
    writer.writerows(menu_item_bridge)

# --- EMPLOYEES ---
employees = []
# Tracker to count total orders processed by each employee
employee_order_tracker = {i + 1: 0 for i in range(NUM_EMPLOYEES)}

for i in range(1, NUM_EMPLOYEES + 1):
    job = "Manager" if i == 1 else "Barista"
    employees.append([
        i,
        f"Employee_{i}",
        round(random.uniform(12, 20), 2),
        job,
        0 # orderNum (will be updated later)
    ])

# --- ORDERS + ORDER_HISTORY ---
orders = []
order_history = []
order_id = 1
total_revenue = 0

current_date = START_DATE
end_date = START_DATE + timedelta(weeks=NUM_WEEKS)

while current_date < end_date:
    # base daily orders
    daily_orders = random.randint(150, 170)

    # boost peak days
    if any(current_date.date() == peak.date() for peak in PEAK_DAYS):
        daily_orders *= 3

    for _ in range(daily_orders):
        hour, minute = random_time()
        order_time = current_date.replace(hour=hour, minute=minute)

        employee_id = random.randint(1, NUM_EMPLOYEES)
        # Update employee tracker
        employee_order_tracker[employee_id] += 1

        num_items = random.randint(1, 3)
        selected_menu = random.sample(menu_items, num_items)

        order_total = 0
        for menu in selected_menu:
            quantity = random.randint(1, 2)
            topping = random.choice(TOPPING_OPTIONS)
            topping_cost = 0.50 if topping != "None" else 0.00
            line_total = quantity * menu[2] + topping_cost
            order_total += line_total

            # UPDATE SALES TRACKER FOR THE MENU ITEM
            sales_tracker[menu[0]] += quantity

            order_history.append([
                len(order_history) + 1,
                menu[0],
                order_id,
                quantity,
                random.choice(ICE_OPTIONS),
                random.choice(SUGAR_OPTIONS),
                topping,
                menu[2]+topping_cost
            ])

        total_revenue += order_total

        orders.append([
            order_id,
            f"Customer_{order_id}",
            round(order_total, 2),
            employee_id,
            order_time.strftime("%Y-%m-%d %H:%M:%S")
        ])

        order_id += 1

    current_date += timedelta(days=1)

# --- FINAL SYNC: Update list values from trackers before writing ---

# Sync Sales Numbers to Menu List
for menu in menu_items:
    menu[3] = sales_tracker[menu[0]]

# Sync Order Counts to Employee List
for emp in employees:
    emp[4] = employee_order_tracker[emp[0]]

# --- WRITE FILES ---

print("Total Revenue Generated:", round(total_revenue, 2))

with open("menu.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["menuID", "name", "cost", "salesNum", "image_url"])
    writer.writerows(menu_items)

with open("employee.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["employeeID", "name", "pay", "job", "orderNum"])
    writer.writerows(employees)

with open("order.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["orderID", "customerName", "costTotal", "employeeID", "orderDateTime"])
    writer.writerows(orders)

with open("order_history.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["ID", "menuID", "orderID", "quantity", "iceLevel", "sugarLevel", "topping", "cost"])
    writer.writerows(order_history)

print("CSV files successfully generated.")